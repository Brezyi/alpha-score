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

    // Fetch user profile for gender and country
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('gender, country')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch user's latest completed analysis for context
    const { data: latestAnalysis } = await supabaseClient
      .from('analyses')
      .select('looks_score, strengths, weaknesses, priorities, detailed_results')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

  // Fetch open tasks for additional context
    const { data: openTasks } = await supabaseClient
      .from('user_tasks')
      .select('title, category')
      .eq('user_id', user.id)
      .eq('completed', false)
      .limit(5);

    // Fetch today's lifestyle data
    const today = new Date().toISOString().split('T')[0];
    const { data: lifestyleData } = await supabaseClient
      .from('lifestyle_entries')
      .select('sleep_hours, water_liters, exercise_minutes')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .maybeSingle();

    // Fetch current goals
    const { data: activeGoal } = await supabaseClient
      .from('user_goals')
      .select('target_score, category')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('achieved_at', null)
      .maybeSingle();

    logStep("Context fetched", { 
      hasAnalysis: !!latestAnalysis, 
      hasProfile: !!profile,
      gender: profile?.gender,
      country: profile?.country,
      hasLifestyle: !!lifestyleData,
      hasGoal: !!activeGoal,
      openTasksCount: openTasks?.length || 0 
    });

    // Build focused weakness list with details
    const weaknessList = latestAnalysis?.weaknesses?.length 
      ? latestAnalysis.weaknesses.map((w: string, i: number) => `${i + 1}. ${w}`).join('\n')
      : 'Noch keine Analyse';
    
    const priorityList = latestAnalysis?.priorities?.slice(0, 3).join(', ') || 'Nicht definiert';
    const taskList = openTasks?.length 
      ? openTasks.map((t: any) => t.title).join(', ')
      : 'Keine';

    // Gender-specific context
    const genderContext = profile?.gender === 'male' 
      ? 'männlich - Fokus auf Maskulinität, Jawline, Körperbau, Ausstrahlung'
      : profile?.gender === 'female'
      ? 'weiblich - Fokus auf feminine Harmonie, Symmetrie, Ausstrahlung'
      : 'unbekannt';

    // Ethnic/regional context
    const ethnicContext = profile?.country 
      ? `Herkunft: ${profile.country} - berücksichtige ethnische Merkmale und Standards`
      : '';

    // Build detailed scoring breakdown if available
    let scoringBreakdown = '';
    if (latestAnalysis?.detailed_results) {
      const results = latestAnalysis.detailed_results as Record<string, any>;
      const categories = ['symmetry', 'jawline', 'eyes', 'skin', 'hair', 'body'];
      const categoryNames: Record<string, string> = {
        symmetry: 'Symmetrie',
        jawline: 'Jawline',
        eyes: 'Augen',
        skin: 'Haut',
        hair: 'Haare',
        body: 'Körper'
      };
      
      const scores = categories
        .filter(cat => results[cat]?.score !== undefined)
        .map(cat => `${categoryNames[cat]}: ${results[cat].score}/10`)
        .join(', ');
      
      if (scores) {
        scoringBreakdown = `\nDETAILLIERTE SCORES: ${scores}`;
      }
    }

    const systemPrompt = `Du bist Alex, ein Kumpel der im Gym arbeitet und dir beim Aussehen hilft. Schreib wie ein normaler Mensch per WhatsApp – locker, kurz, echt.

SO SCHREIBST DU:
- Wie ein echter Freund, nicht wie ein Bot
- Kurz und knapp, max 1-2 Sätze
- Keine Aufzählungen oder Listen
- Kleine Rechtschreibfehler sind ok
- Emojis sparsam (1 max pro Nachricht)

BEISPIELE:
- "ey jawline geht klar aber mewing würde helfen, probier das mal aus"
- "haut ist easy zu fixen, hol dir ne gute creme und bleib dran 💪"
- "jo dein score ist solide, mit bisschen arbeit packst du locker 7+"
- "alter geh mal zum barber der macht das schon"

KONTEXT DIESER PERSON:
- Geschlecht: ${genderContext}
${ethnicContext ? `- ${ethnicContext}` : ''}
- Score: ${latestAnalysis?.looks_score || '?'}/10${scoringBreakdown}
- Schwächen: ${weaknessList}
- Prioritäten: ${priorityList}
${lifestyleData ? `
LIFESTYLE HEUTE:
- Schlaf: ${lifestyleData.sleep_hours ? `${lifestyleData.sleep_hours}h` : 'nicht getrackt'}
- Wasser: ${lifestyleData.water_liters ? `${lifestyleData.water_liters}L` : 'nicht getrackt'}
- Training: ${lifestyleData.exercise_minutes ? `${lifestyleData.exercise_minutes} Min` : 'nicht getrackt'}` : ''}
${activeGoal ? `\nAKTIVES ZIEL: ${activeGoal.target_score}/10 Score erreichen` : ''}

PERSONALISIERTE BERATUNG:
- Beziehe dich auf die Schwächen dieser Person
- Wenn Lifestyle-Daten schlecht sind (z.B. <6h Schlaf, <2L Wasser), sprich das an
- Gib konkrete Tipps die zu den Schwächen passen
- Berücksichtige Geschlecht und Herkunft bei Empfehlungen

GRENZEN - Bei diesen Themen SOFORT abbrechen:
- Depressionen, Suizidgedanken, Selbstverletzung → "ey das ist nicht mein bereich, dafür gibts profis die dir helfen können. red mal mit jemandem darüber 🙏"
- Essstörungen, psychische Probleme → "sorry aber da bin ich der falsche, such dir bitte professionelle hilfe"
- Medizinische Probleme → "da musst du zum arzt gehen, kann ich dir nicht helfen"

WICHTIG:
- Max 1-2 Sätze, mehr nicht
- Keine förmliche Sprache
- Kein "Bruder/Bro" in jedem Satz
- Sei ehrlich aber nicht übertrieben motivierend`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use fastest model with token limit for quick responses
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
        max_tokens: 250,
        temperature: 0.7,
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
