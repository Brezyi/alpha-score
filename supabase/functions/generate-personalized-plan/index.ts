import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-PLAN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  try {
    logStep("Function started");

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }
    logStep("User authenticated", { userId: user.id });

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch latest completed analysis
    const { data: analysis, error: analysisError } = await supabaseClient
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError || !analysis) {
      throw new Error("No completed analysis found");
    }
    logStep("Analysis fetched", { analysisId: analysis.id, score: analysis.looks_score });

    // Build context from analysis
    const detailedResults = analysis.detailed_results as any || {};
    
    const analysisContext = `
AKTUELLE ANALYSE-ERGEBNISSE:
- Gesamtscore: ${analysis.looks_score}/10
- Stärken: ${(analysis.strengths || []).join("; ")}
- Schwächen: ${(analysis.weaknesses || []).join("; ")}
- Prioritäten: ${(analysis.priorities || []).join("; ")}

DETAILLIERTE BEWERTUNGEN:
${detailedResults.face_symmetry ? `- Gesichtssymmetrie: ${detailedResults.face_symmetry.score}/10 - ${detailedResults.face_symmetry.details}` : ""}
${detailedResults.jawline ? `- Jawline: ${detailedResults.jawline.score}/10 - ${detailedResults.jawline.details}` : ""}
${detailedResults.eyes ? `- Augen: ${detailedResults.eyes.score}/10 - ${detailedResults.eyes.details}` : ""}
${detailedResults.skin ? `- Haut: ${detailedResults.skin.score}/10 - ${detailedResults.skin.details}` : ""}
${detailedResults.hair ? `- Haare: ${detailedResults.hair.score}/10 - ${detailedResults.hair.details}` : ""}
${detailedResults.overall_vibe ? `- Gesamtausstrahlung: ${detailedResults.overall_vibe.score}/10 - ${detailedResults.overall_vibe.details}` : ""}
`;

    const systemPrompt = `Du bist ein Looksmaxing-Experte und erstellst PERSONALISIERTE Verbesserungspläne.

REGELN:
1. Der Plan muss DIREKT aus den Analyse-Ergebnissen abgeleitet werden
2. Keine generischen Ratschläge - alles muss zum spezifischen Nutzer passen
3. Priorisiere nach IMPACT: Was bringt die größte Verbesserung?
4. Sei KONKRET: Produktnamen, Dosierungen, Frequenzen
5. Kategorisiere in Tages-, Wochen- und Monatsaufgaben

KATEGORIEN:
- skincare: Hautpflege-Routine
- hair: Haare, Bart, Frisur
- body: Fitness, Körperfett, Haltung
- style: Kleidung, Grooming
- teeth: Zahnpflege, Lächeln
- mindset: Ausstrahlung, Selbstbewusstsein

Erstelle 3-5 hochspezifische Aufgaben pro relevanter Kategorie.
Überspringe Kategorien, die laut Analyse keine Priorität haben.`;

    const userPrompt = `Basierend auf dieser Analyse, erstelle einen PERSONALISIERTEN Looksmax-Plan:

${analysisContext}

Generiere Aufgaben die DIREKT die identifizierten Schwächen adressieren.
Fokus auf die Top-3 Prioritäten aus der Analyse.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_plan",
              description: "Generate personalized looksmax plan tasks",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { 
                          type: "string", 
                          enum: ["skincare", "hair", "body", "style", "teeth", "mindset"],
                          description: "Task category"
                        },
                        title: { type: "string", description: "Short task title" },
                        description: { type: "string", description: "Detailed instruction" },
                        priority: { type: "number", description: "Priority 1-5 (1 = highest)" },
                        frequency: { 
                          type: "string", 
                          enum: ["daily", "weekly", "monthly", "once"],
                          description: "How often to do this task"
                        },
                        reason: { type: "string", description: "Why this task based on analysis" }
                      },
                      required: ["category", "title", "description", "priority", "frequency", "reason"]
                    }
                  },
                  focus_areas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3 focus areas from analysis"
                  }
                },
                required: ["tasks", "focus_areas"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_plan" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "generate_plan") {
      throw new Error("Invalid AI response");
    }

    const planResult = JSON.parse(toolCall.function.arguments);
    logStep("Plan generated", { taskCount: planResult.tasks?.length });

    // Delete existing tasks
    await supabaseClient
      .from("user_tasks")
      .delete()
      .eq("user_id", user.id);

    // Insert new personalized tasks
    const tasksToInsert = planResult.tasks.map((task: any) => ({
      user_id: user.id,
      category: task.category,
      title: task.title,
      description: `${task.description}\n\n📌 Warum: ${task.reason}`,
      priority: Math.round(Number(task.priority)) || 1,
      completed: false,
    }));

    const { data: insertedTasks, error: insertError } = await supabaseClient
      .from("user_tasks")
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert tasks: ${insertError.message}`);
    }

    logStep("Tasks saved", { count: insertedTasks?.length });

    return new Response(JSON.stringify({
      success: true,
      tasks: insertedTasks,
      focus_areas: planResult.focus_areas,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
