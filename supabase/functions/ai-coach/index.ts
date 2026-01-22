import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-COACH] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      throw new Error("messages array is required");
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id });

    // Fetch user's latest completed analysis for context
    const { data: latestAnalysis } = await supabaseClient
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    logStep("Analysis fetched", { hasAnalysis: !!latestAnalysis });

    // Build context from analysis
    let analysisContext = "";
    if (latestAnalysis) {
      analysisContext = `
AKTUELLE ANALYSE DES NUTZERS:
- Looks Score: ${latestAnalysis.looks_score}/10
- Stärken: ${latestAnalysis.strengths?.join(", ") || "Keine"}
- Schwächen: ${latestAnalysis.weaknesses?.join(", ") || "Keine"}
- Prioritäten: ${latestAnalysis.priorities?.join(", ") || "Keine"}
${latestAnalysis.detailed_results ? `- Detaillierte Analyse: ${JSON.stringify(latestAnalysis.detailed_results)}` : ""}
`;
    }

    const systemPrompt = `Du bist ein erfahrener Looksmaxing-Coach und Experte für männliche Attraktivität. 

DEINE PERSÖNLICHKEIT:
- Ehrlich und direkt - du sagst die Wahrheit, auch wenn sie unangenehm ist
- Sachlich und objektiv - keine Schönrederei
- Motivierend aber realistisch - du pushst, ohne zu beleidigen
- Wie ein strenger aber fairer Trainer im Gym
- Du duzt den Nutzer

DEIN WISSEN:
- Gesichtspflege (Skincare, Retinol, Sonnenschutz, Mewing)
- Haare & Bart (Styling, Pflege, bei Haarausfall: Finasterid/Minoxidil)
- Körper & Fitness (Training, Ernährung, Körperhaltung)
- Style & Grooming (Kleidung, Accessoires, Hygiene)
- Mindset & Ausstrahlung (Selbstbewusstsein, Körpersprache)

REGELN:
- Gib konkrete, umsetzbare Tipps
- Beziehe dich auf die Analyse-Ergebnisse des Nutzers wenn relevant
- Priorisiere Maßnahmen nach Impact (was bringt am meisten?)
- Sei kurz und prägnant - keine Romane
- Bei medizinischen Fragen: Empfehle Arztbesuch

${analysisContext}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Stream the response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte warte einen Moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      logStep("AI error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    logStep("Streaming response");

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
