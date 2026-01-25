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
      .select('sleep_hours, sleep_quality, water_liters, exercise_minutes')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .maybeSingle();

    // Fetch last 7 days lifestyle for trends
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: weekLifestyle } = await supabaseClient
      .from('lifestyle_entries')
      .select('sleep_hours, water_liters, exercise_minutes')
      .eq('user_id', user.id)
      .gte('entry_date', weekAgo)
      .order('entry_date', { ascending: false });

    // Fetch current goals
    const { data: activeGoal } = await supabaseClient
      .from('user_goals')
      .select('target_score, category')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('achieved_at', null)
      .maybeSingle();

    // Fetch face fitness sessions this week
    const { data: faceFitnessSessions } = await supabaseClient
      .from('face_fitness_sessions')
      .select('exercise_key, duration_seconds')
      .eq('user_id', user.id)
      .gte('completed_at', weekAgo);

    // Fetch user streaks
    const { data: streakData } = await supabaseClient
      .from('user_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .maybeSingle();

    // Calculate lifestyle averages
    const avgSleep = weekLifestyle?.length 
      ? (weekLifestyle.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / weekLifestyle.length).toFixed(1)
      : null;
    const avgWater = weekLifestyle?.length 
      ? (weekLifestyle.reduce((sum, d) => sum + (d.water_liters || 0), 0) / weekLifestyle.length).toFixed(1)
      : null;
    const avgExercise = weekLifestyle?.length 
      ? Math.round(weekLifestyle.reduce((sum, d) => sum + (d.exercise_minutes || 0), 0) / weekLifestyle.length)
      : null;

    logStep("Context fetched", { 
      hasAnalysis: !!latestAnalysis, 
      hasProfile: !!profile,
      gender: profile?.gender,
      country: profile?.country,
      hasLifestyle: !!lifestyleData,
      hasGoal: !!activeGoal,
      faceFitnessSessions: faceFitnessSessions?.length || 0,
      streak: streakData?.current_streak || 0,
      openTasksCount: openTasks?.length || 0 
    });

    // Build detailed weakness analysis with specific recommendations
    const weaknessDetails: Record<string, string> = {
      'Jawline': 'Mewing 20min/Tag, Jawline-Übungen, weniger Salz für weniger Wassereinlagerungen',
      'Haut': 'Retinol Abends, Vitamin C Morgens, SPF 50 täglich, 3L Wasser minimum',
      'Symmetrie': 'Schlafen auf dem Rücken, bewusst auf Körperhaltung achten, Nackendehnung',
      'Haare': 'Minoxidil wenn Geheimratsecken, Biotin + Zink Supplements, weniger Hitze',
      'Augen': '8h Schlaf minimum, weniger Screen-Zeit abends, Augencreme mit Koffein',
      'Körper': 'Krafttraining 4x/Woche, Protein 1.6g/kg, Kaloriendefizit wenn nötig',
      'Akne': 'Salicylsäure Cleanser, Benzoylperoxid Spots, Finger aus dem Gesicht',
      'Lippen': 'Lippenbalsam mit SPF, viel Wasser, Peeling 2x/Woche',
      'Nase': 'Konturierung mit Make-up möglich, sonst Akzeptanz oder Rhinoplastik',
      'Augenbrauen': 'Professionelles Zupfen/Waxing, Castor Oil für Wachstum',
      'Körperhaltung': 'Face Pulls, Rear Delt Flyes, Wandsitzen 5min täglich',
      'Muskulatur': 'Progressive Overload, Compound-Übungen, ausreichend Schlaf für Regeneration'
    };

    const weaknessList = latestAnalysis?.weaknesses?.length 
      ? latestAnalysis.weaknesses.map((w: string, i: number) => {
          const detail = weaknessDetails[w] || '';
          return `${i + 1}. ${w}${detail ? ` → ${detail}` : ''}`;
        }).join('\n')
      : 'Noch keine Analyse vorhanden';
    
    const priorityList = latestAnalysis?.priorities?.slice(0, 3).join(', ') || 'Nicht definiert';

    // Gender-specific detailed context
    const genderContext = profile?.gender === 'male' 
      ? 'MÄNNLICH - Fokus auf: definierte Jawline, V-förmiger Oberkörper, tiefe Stimme, maskuline Ausstrahlung, Hunter Eyes, breite Schultern'
      : profile?.gender === 'female'
      ? 'WEIBLICH - Fokus auf: harmonische Proportionen, gepflegte Haut, feminine Gesichtszüge, Körperform, Ausstrahlung'
      : 'Geschlecht unbekannt';

    // Regional context for beauty standards
    const regionalContext: Record<string, string> = {
      'Germany': 'Deutsche Standards: natürliches Aussehen bevorzugt, gepflegt aber nicht overdone',
      'Austria': 'Österreichische Standards: ähnlich Deutschland, klassisch-gepflegt',
      'Switzerland': 'Schweizer Standards: dezent-elegant, qualitätsbewusst',
      'Turkey': 'Türkische Standards: gepflegter Bart bei Männern, volle Augenbrauen geschätzt',
      'Russia': 'Russische Standards: klassische Schönheit, bei Frauen femininer Look wichtig',
      'USA': 'US Standards: oft mehr Fokus auf Fitness/Körper, strahlend weiße Zähne'
    };
    const ethnicContext = profile?.country 
      ? regionalContext[profile.country] || `Region: ${profile.country}`
      : '';

    // Build detailed scoring breakdown
    let scoringBreakdown = '';
    let worstCategory = '';
    let worstScore = 10;
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
        .map(cat => {
          if (results[cat].score < worstScore) {
            worstScore = results[cat].score;
            worstCategory = categoryNames[cat];
          }
          return `${categoryNames[cat]}: ${results[cat].score}/10`;
        })
        .join(', ');
      
      if (scores) {
        scoringBreakdown = `\nDETAIL-SCORES: ${scores}`;
        if (worstCategory) {
          scoringBreakdown += `\nSCHWÄCHSTE KATEGORIE: ${worstCategory} (${worstScore}/10) - hier liegt das größte Potenzial!`;
        }
      }
    }

    // Build lifestyle context
    let lifestyleContext = '';
    if (lifestyleData) {
      const issues: string[] = [];
      if (lifestyleData.sleep_hours && lifestyleData.sleep_hours < 7) {
        issues.push(`NUR ${lifestyleData.sleep_hours}h SCHLAF HEUTE - das zerstört deine Gains und Hautregeneration`);
      }
      if (lifestyleData.water_liters && lifestyleData.water_liters < 2) {
        issues.push(`NUR ${lifestyleData.water_liters}L WASSER - viel zu wenig für gute Haut`);
      }
      if (lifestyleData.exercise_minutes && lifestyleData.exercise_minutes < 20) {
        issues.push(`NUR ${lifestyleData.exercise_minutes}min Training - zu wenig für Körperverbesserung`);
      }
      
      lifestyleContext = issues.length > 0 
        ? `\n⚠️ KRITISCHE LIFESTYLE-PROBLEME HEUTE:\n${issues.join('\n')}`
        : `\nLIFESTYLE HEUTE: ${lifestyleData.sleep_hours || '?'}h Schlaf, ${lifestyleData.water_liters || '?'}L Wasser, ${lifestyleData.exercise_minutes || 0}min Training`;
    }

    // Weekly averages context
    let weeklyContext = '';
    if (avgSleep || avgWater || avgExercise) {
      weeklyContext = `\nWOCHEN-DURCHSCHNITT: ${avgSleep || '?'}h Schlaf, ${avgWater || '?'}L Wasser, ${avgExercise || 0}min Training/Tag`;
    }

    // Face fitness context
    let faceFitnessContext = '';
    if (faceFitnessSessions && faceFitnessSessions.length > 0) {
      const totalMinutes = Math.round(faceFitnessSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);
      faceFitnessContext = `\nFACE FITNESS DIESE WOCHE: ${faceFitnessSessions.length} Sessions, ${totalMinutes} Minuten total`;
    } else {
      faceFitnessContext = '\nFACE FITNESS: Macht keine Übungen - sollte damit anfangen!';
    }

    // Streak context
    const streakContext = streakData?.current_streak 
      ? `\nSTREAK: ${streakData.current_streak} Tage am Stück aktiv (Rekord: ${streakData.longest_streak})`
      : '';

    const systemPrompt = `Du bist Alex, ein brutaler aber hilfreicher Coach der im Gym arbeitet. Du gibst KEINE generischen 0815-Tipps sondern SPEZIFISCHE, PERSONALISIERTE Ratschläge basierend auf den echten Daten dieser Person.

DEIN STIL:
- Kurz und direkt, max 2-3 Sätze
- Wie ein ehrlicher Freund per WhatsApp
- Sprich KONKRETE Schwächen an, keine Allgemeinplätze
- Wenn Lifestyle-Daten schlecht sind, sag es direkt
- Gib EXAKTE Tipps (z.B. "2g Kreatin täglich" statt "nimm Supplements")

❌ NIEMALS SAGEN:
- "Trink genug Wasser" → stattdessen "Du trinkst nur 1.5L, brauchst mindestens 2.5L"
- "Mach Face Exercises" → stattdessen "Deine Jawline ist 5/10, mach Mewing 20min täglich"
- "Schlaf mehr" → stattdessen "6h Schlaf = dein Cortisol geht hoch, Haut wird schlechter"
- "Achte auf deine Ernährung" → stattdessen "Bei Akne: kein Zucker, keine Milch für 2 Wochen"

✅ SO ANTWORTEST DU:
- "deine jawline ist 5/10 - mewing 3x20min am tag, in 3 monaten siehst du unterschied"
- "haut bei 4/10, das ist fixbar: retinol abends, vitamin c morgens, 3L wasser"
- "du schläfst zu wenig, bei 6h regeneriert deine haut nicht - mindestens 7.5h"
- "face fitness machst du nicht - fang mit mewing an, 20min morgens"

KONTEXT DIESER PERSON:
═══════════════════════════════════════
${genderContext}
${ethnicContext ? ethnicContext : ''}

AKTUELLER SCORE: ${latestAnalysis?.looks_score || '?'}/10
${scoringBreakdown}

SCHWÄCHEN MIT LÖSUNGEN:
${weaknessList}

PRIORITÄTEN: ${priorityList}
${lifestyleContext}
${weeklyContext}
${faceFitnessContext}
${streakContext}
${activeGoal ? `\nZIEL: ${activeGoal.target_score}/10 erreichen` : ''}
═══════════════════════════════════════

WICHTIGE REGELN:
1. Bezieh dich IMMER auf die konkreten Daten oben
2. Nenne EXAKTE Zahlen wenn verfügbar (Score, Schlafstunden, etc.)
3. Gib SPEZIFISCHE Produktempfehlungen (z.B. "CeraVe Cleanser" statt "gute Creme")
4. Wenn jemand zu wenig schläft/trinkt, sprich das SOFORT an
5. Keine motivierenden Floskeln - sei direkt und ehrlich

GRENZEN (sofort abbrechen bei):
- Depression/Suizid → "ey das ist ernst, dafür gibts profis. telefonseelsorge: 0800 111 0 111"
- Essstörungen → "das ist medizinisch, geh bitte zum arzt"
- Medizinische Fragen → "da kann ich nicht helfen, ab zum doc"`;

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
