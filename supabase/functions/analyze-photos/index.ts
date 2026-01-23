import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-PHOTOS] ${step}${detailsStr}`);
};

// Helper function to convert ArrayBuffer to base64 without stack overflow
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
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

    // SECURITY: Verify user is authenticated
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
      logStep("Authentication failed", { error: authError?.message });
      throw new Error("Unauthorized: Authentication required");
    }
    logStep("User authenticated", { userId: user.id });

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { analysisId } = await req.json();
    if (!analysisId) {
      throw new Error("analysisId is required");
    }
    logStep("Analysis ID received", { analysisId });

    // Fetch the analysis record
    const { data: analysis, error: fetchError } = await supabaseClient
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error(`Analysis not found: ${fetchError?.message}`);
    }

    // SECURITY: Verify user owns this analysis
    if (analysis.user_id !== user.id) {
      logStep("Ownership check failed", { analysisUserId: analysis.user_id, requestUserId: user.id });
      throw new Error("Unauthorized: Analysis does not belong to user");
    }
    logStep("Analysis fetched and ownership verified", { status: analysis.status, photoCount: analysis.photo_urls?.length });

    // Fetch user profile for gender and country context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('gender, country')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const userGender = profile?.gender || null;
    const userCountry = profile?.country || null;
    logStep("User profile fetched", { gender: userGender, country: userCountry });

    // Update status to processing
    await supabaseClient
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId);

    // Get signed URLs for the photos (since bucket is private)
    const photoUrls = analysis.photo_urls || [];
    const photoDataUrls: string[] = [];

    for (const url of photoUrls) {
      const urlParts = url.split('/analysis-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        const { data: signedData, error: signedError } = await supabaseClient.storage
          .from('analysis-photos')
          .createSignedUrl(filePath, 300);

        if (signedError) {
          logStep("Signed URL error", { error: signedError.message, filePath });
          continue;
        }

        if (signedData?.signedUrl) {
          try {
            const imageResponse = await fetch(signedData.signedUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64 = arrayBufferToBase64(imageBuffer);
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            photoDataUrls.push(`data:${contentType};base64,${base64}`);
            logStep("Photo converted to base64", { filePath, size: imageBuffer.byteLength });
          } catch (conversionError) {
            logStep("Photo conversion error", { filePath, error: String(conversionError) });
          }
        }
      }
    }

    if (photoDataUrls.length === 0) {
      throw new Error("No valid photos found for analysis");
    }
    logStep("Photos prepared for analysis", { count: photoDataUrls.length });

    // ====== STEP 0: Content Moderation (Illegal Content Detection) ======
    logStep("Starting content moderation check");
    const moderationPrompt = `Du bist ein Content-Moderator. Prüfe dieses Bild auf ILLEGALE oder VERBOTENE Inhalte.

SOFORT ABLEHNEN bei:
- Kinderpornografie oder Minderjährige in unangemessenen Situationen
- Explizite sexuelle Inhalte oder Pornografie
- Extreme Gewalt, Gore oder verstümmelte Körper
- Terrorismus-Propaganda oder Hasssymbole (Nazi-Symbole, etc.)
- Illegale Drogen oder Drogenkonsum
- Waffen mit Drohgebärden

AKZEPTABEL (auch wenn ungewöhnlich):
- Normale Selfies/Porträtfotos
- Künstlerische Nacktheit ohne sexuellen Fokus
- Medizinische/chirurgische Bilder
- Sport/Fitness-Fotos

Sei präzise: Nur echte Verstöße ablehnen, keine harmlosen Fotos.`;

    const moderationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: moderationPrompt },
              { type: "image_url", image_url: { url: photoDataUrls[0] } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "moderate_content",
              description: "Check if the image contains illegal or prohibited content",
              parameters: {
                type: "object",
                properties: {
                  is_safe: { type: "boolean", description: "True if the image is safe and allowed" },
                  is_illegal: { type: "boolean", description: "True if the image contains illegal content that requires user ban" },
                  violation_type: { type: "string", description: "Type of violation if any: 'child_exploitation', 'explicit_sexual', 'extreme_violence', 'hate_symbols', 'drugs', 'weapons', 'other'" },
                  violation_severity: { type: "string", description: "'critical' for illegal content, 'high' for TOS violations, 'none' for safe content" },
                  reason: { type: "string", description: "Brief explanation of why the content was flagged or approved" }
                },
                required: ["is_safe", "is_illegal"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "moderate_content" } }
      }),
    });

    if (moderationResponse.ok) {
      const moderationData = await moderationResponse.json();
      const moderationToolCall = moderationData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (moderationToolCall && moderationToolCall.function.name === "moderate_content") {
        const moderationResult = JSON.parse(moderationToolCall.function.arguments);
        logStep("Content moderation result", moderationResult);

        if (moderationResult.is_illegal || !moderationResult.is_safe) {
          logStep("ILLEGAL CONTENT DETECTED - Banning user and deleting content", { userId: user.id });

          // 1. Delete all user's photos from storage
          const { data: userPhotos } = await supabaseClient
            .from('analyses')
            .select('photo_urls')
            .eq('user_id', user.id);

          if (userPhotos) {
            for (const analysis of userPhotos) {
              for (const url of analysis.photo_urls || []) {
                const urlParts = url.split('/analysis-photos/');
                if (urlParts.length > 1) {
                  const filePath = urlParts[1];
                  await supabaseClient.storage.from('analysis-photos').remove([filePath]);
                  logStep("Deleted photo", { filePath });
                }
              }
            }
          }

          // 2. Delete all user's analyses
          await supabaseClient
            .from('analyses')
            .delete()
            .eq('user_id', user.id);

          // 3. Create audit log for the ban
          await supabaseClient.rpc('create_audit_log', {
            _action_type: 'CONTENT_VIOLATION_BAN',
            _table_name: 'users',
            _record_id: user.id,
            _actor_id: user.id,
            _target_user_id: user.id,
            _old_values: null,
            _new_values: { 
              violation_type: moderationResult.violation_type,
              violation_severity: moderationResult.violation_severity,
              reason: moderationResult.reason
            },
            _metadata: { 
              event: 'User banned for illegal content',
              auto_moderation: true
            }
          });

          // Return banned status
          return new Response(JSON.stringify({
            success: false,
            error: "CONTENT_VIOLATION",
            message: "Dein Account wurde wegen Verstoßes gegen unsere Nutzungsbedingungen gesperrt. Alle deine Daten wurden gelöscht.",
            banned: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    } else {
      logStep("Content moderation API error - continuing with caution", { status: moderationResponse.status });
    }

    logStep("Content moderation passed");

    // ====== STEP 1: Face Detection Validation ======
    logStep("Starting face validation");
    const validationPrompt = `Analysiere dieses Bild und prüfe ob es für eine Gesichtsanalyse geeignet ist.

Prüfe folgende Kriterien:
1. Ist ein menschliches Gesicht sichtbar?
2. Ist das Gesicht groß genug (mindestens 20% des Bildes)?
3. Ist das Gesicht klar und nicht verdeckt (keine Sonnenbrille, Maske, Hand vor Gesicht)?
4. Ist das Bild scharf genug?
5. Ist das Gesicht frontal oder maximal leicht seitlich?
6. Gibt es nur EIN Hauptgesicht im Bild?

Wichtig: Sei streng bei der Bewertung. Das Foto muss für eine professionelle Gesichtsanalyse geeignet sein.`;


    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: validationPrompt },
              { type: "image_url", image_url: { url: photoDataUrls[0] } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "validate_face",
              description: "Validate if the image is suitable for face analysis",
              parameters: {
                type: "object",
                properties: {
                  is_valid: { type: "boolean", description: "True if the image is suitable for face analysis" },
                  face_detected: { type: "boolean", description: "True if a human face is clearly visible" },
                  face_size_ok: { type: "boolean", description: "True if the face is large enough" },
                  face_clear: { type: "boolean", description: "True if the face is not obstructed" },
                  image_sharp: { type: "boolean", description: "True if the image is sharp enough" },
                  face_frontal: { type: "boolean", description: "True if the face is frontal or only slightly angled" },
                  single_face: { type: "boolean", description: "True if there is only one main face" },
                  rejection_reason: { type: "string", description: "Specific reason why the image was rejected" }
                },
                required: ["is_valid", "face_detected"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "validate_face" } }
      }),
    });

    if (!validationResponse.ok) {
      const errorText = await validationResponse.text();
      logStep("Face validation API error", { status: validationResponse.status, error: errorText });
      throw new Error("Face validation failed - please try again");
    }

    const validationData = await validationResponse.json();
    const validationToolCall = validationData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!validationToolCall || validationToolCall.function.name !== "validate_face") {
      throw new Error("Face validation failed - invalid response");
    }

    const validationResult = JSON.parse(validationToolCall.function.arguments);
    logStep("Face validation result", validationResult);

    // Check if face validation failed
    if (!validationResult.is_valid || !validationResult.face_detected) {
      let errorMessage = "Kein Gesicht erkannt. Bitte lade ein klares Foto deines Gesichts hoch (frontal, gute Beleuchtung).";
      
      if (!validationResult.face_detected) {
        errorMessage = "Kein Gesicht erkannt. Bitte lade ein klares Foto deines Gesichts hoch (frontal, gute Beleuchtung).";
      } else if (validationResult.face_size_ok === false) {
        errorMessage = "Das Gesicht ist zu klein. Bitte lade ein Foto hoch, auf dem dein Gesicht größer zu sehen ist.";
      } else if (validationResult.face_clear === false) {
        errorMessage = "Das Gesicht ist verdeckt. Bitte entferne Sonnenbrillen, Masken oder andere Hindernisse.";
      } else if (validationResult.image_sharp === false) {
        errorMessage = "Das Bild ist unscharf. Bitte lade ein schärferes Foto hoch.";
      } else if (validationResult.face_frontal === false) {
        errorMessage = "Bitte lade ein frontales Foto hoch, auf dem dein Gesicht direkt in die Kamera schaut.";
      } else if (validationResult.single_face === false) {
        errorMessage = "Es wurden mehrere Gesichter erkannt. Bitte lade ein Foto mit nur deinem Gesicht hoch.";
      } else if (validationResult.rejection_reason) {
        errorMessage = validationResult.rejection_reason;
      }

      // Mark analysis as validation_failed (no credits consumed)
      await supabaseClient
        .from('analyses')
        .update({ 
          status: 'validation_failed',
          detailed_results: { 
            validation_error: errorMessage,
            validation_details: validationResult 
          }
        })
        .eq('id', analysisId);

      logStep("Face validation failed", { errorMessage });

      // NOTE: Return 200 for domain validation failures so supabase-js `invoke()` doesn't throw
      // and potentially surface this as a runtime error in the client.
      // The authoritative state is persisted in the DB via `status = validation_failed`.
      return new Response(JSON.stringify({
        success: false,
        error: "FACE_VALIDATION_FAILED",
        message: errorMessage,
        validation: validationResult,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Face validation passed - proceeding with main analysis");

    // ====== STEP 2: Main AI Analysis (Critical & Detailed) ======
    
    // Build gender-specific context with detailed criteria
    const genderContext = userGender === 'male' 
      ? `MÄNNLICH - Bewertungsfokus:
   • Jawline: Stark definiert, kantiger Unterkiefer, ausgeprägte Masseter
   • Gesichtsform: Markant, hohe Wangenknochen, prominente Stirn
   • Augenbrauen: Gerade/leicht gewölbt, dicht, tief sitzend
   • Hals: Breiter Nacken, sichtbarer Adamsapfel
   • Ausstrahlung: Dominanz, Selbstsicherheit, maskuline Präsenz`
      : userGender === 'female'
      ? `WEIBLICH - Bewertungsfokus:
   • Gesichtsform: Herzförmig/oval, weiche Konturen, zierliches Kinn
   • Lippen: Voll, definierter Amorbogen, harmonische Proportionen
   • Augen: Groß, positiver Kanthalwinkel, volle Wimpern
   • Haut: Gleichmäßiger Teint, natürliches Glow
   • Ausstrahlung: Feminine Harmonie, Symmetrie, Eleganz`
      : 'GESCHLECHT UNBEKANNT - allgemeine Attraktivitätskriterien anwenden';

    // Build ethnicity-aware context with region-specific beauty standards
    const ethnicityMap: Record<string, string> = {
      'Westeuropa': 'Europäische Standards: Definierte Gesichtszüge, hohe Nasenbrücke, ausgeprägte Jawline. Bewerte nach zentraleuropäischen Normen.',
      'Osteuropa': 'Osteuropäische Standards: Slawische Merkmale wie hohe Wangenknochen, markante Kieferpartie. Helle Haut/Augen positiv.',
      'Nordeuropa': 'Skandinavische Standards: Markante aber harmonische Züge, heller Hauttyp, definierte Strukturen.',
      'Südeuropa': 'Mediterrane Standards: Olivfarbene Haut, dunkle Features, markante Nase und Augenbrauen sind typisch und positiv.',
      'Naher Osten': 'Nahöstliche Standards: Starke Augenbrauen, markante Nase, dunkle Augen. Bewerte im Kontext arabischer/persischer Schönheitsideale.',
      'Südasien': 'Südasiatische Standards: Dunkler Teint, volle Lippen, große Augen. Bewerte nach indisch/pakistanischen Normen.',
      'Südostasien': 'Südostasiatische Standards: Harmonische Gesichtszüge, mandelförmige Augen, flachere Nasenbrücke ist normal. K-Beauty Einflüsse berücksichtigen.',
      'Ostasien': 'Ostasiatische Standards: V-förmiges Gesicht, helle Haut, subtile Features. Bewerte nach koreanischen/japanischen/chinesischen Idealen.',
      'Zentralasien': 'Zentralasiatische Standards: Mix aus europäischen und asiatischen Merkmalen, breite Wangenknochen, mandelförmige Augen.',
      'Nordafrika': 'Nordafrikanische Standards: Mediterraner/arabischer Mix, definierte Züge, olivfarbener bis hellbrauner Teint.',
      'Subsahara-Afrika': 'Afrikanische Standards: Vollere Lippen, breitere Nase sind ethnisch normal - NICHT als Schwäche werten. Fokus auf Hautgesundheit und Symmetrie.',
      'Nordamerika': 'Nordamerikanische Standards: Diverse ethnische Hintergründe - frage nach spezifischerer Herkunft für präzisere Bewertung.',
      'Lateinamerika': 'Lateinamerikanische Standards: Mix aus indigenen/europäischen/afrikanischen Merkmalen. Warme Hauttöne, expressive Features.',
      'Ozeanien': 'Ozeanische Standards: Kräftige Gesichtszüge, vollere Lippen, breitere Nase sind ethnisch typisch und positiv zu werten.'
    };

    const ethnicityContext = userCountry 
      ? `HERKUNFT: ${userCountry}
${ethnicityMap[userCountry] || 'Bewerte im Kontext der angegebenen Herkunft. Nicht nach rein westlichen Standards urteilen.'}
WICHTIG: Ethnische Merkmale sind KEINE Schwächen! Bewerte Attraktivität relativ zur Ethnie.`
      : '';

    const systemPrompt = `Du bist ein EXTREM KRITISCHER Experte für Attraktivität und Looksmaxing.

NUTZER-KONTEXT:
- ${genderContext}
${ethnicityContext ? `- ${ethnicityContext}` : ''}

DEINE BEWERTUNGSPHILOSOPHIE:
- EXTREM STRENG und UNGESCHÖNT - KEIN Mitleid, KEINE Schönfärberei
- Ein Score von 7 oder höher ist SELTEN und muss verdient werden
- BRUTAL EHRLICH - sag die Wahrheit, auch wenn sie wehtut
- SPEZIFISCH - benenne EXAKT was falsch ist, nicht vage
- SACHLICH - wie ein plastischer Chirurg, der eine ungeschönte Analyse gibt
- KONSTRUKTIV - jede Kritik mit Lösungsansatz
- ETHNISCH SENSIBEL - bewerte im Kontext der angegebenen Herkunft

BEWERTUNGSSKALA (SEHR STRENG kalibriert - die meisten Menschen sind 4-5.5!):
1-2: Massive Defizite, weit unter Durchschnitt
3-3.9: Deutlich unterdurchschnittlich, multiple Problemzonen
4-4.9: Leicht unterdurchschnittlich, erkennbare Schwächen
5-5.4: EXAKT durchschnittlich - das sind die MEISTEN Menschen
5.5-5.9: Minimal überdurchschnittlich
6-6.4: Überdurchschnittlich, aber klare Schwächen vorhanden
6.5-6.9: Gut aussehend, aber nicht perfekt
7-7.4: ATTRAKTIV - nur wenige erreichen das
7.5-7.9: SEHR ATTRAKTIV - selten
8-8.4: Model-Tier - extrem selten, fast perfekt
8.5-8.9: Elite - professionelles Model-Level
9-9.4: Weltklasse - fast unerreichbar
9.5-10: Praktisch nicht existent - historisch schöne Menschen

WICHTIG: 
- Ein Score von 6+ bedeutet die Person ist ÜBERDURCHSCHNITTLICH attraktiv
- Score 7+ ist bereits TOP 15% der Bevölkerung
- Score 8+ ist Model-Niveau (TOP 2%)
- Gib KEINE inflationierten Scores! Sei BRUTAL ehrlich.
- Wenn jemand durchschnittlich aussieht, gib 5.0-5.4, NICHT 6+!

BEWERTE DIESE BEREICHE MIT TEIL-SCORES (1-10):

1. GESICHTSSYMMETRIE
- Achsenabweichung links/rechts
- Augenposition (gleiche Höhe?)
- Wangenknochen Symmetrie
- Nasenausrichtung

2. JAWLINE / KIEFERPARTIE
- Definition der Kieferlinie
- Submentaler Fettanteil (Doppelkinn?)
- Kinnprojektion
- ${userGender === 'male' ? 'Massetergröße/Maskulinität' : 'Harmonie/Balance'}

3. AUGENBEREICH
- Kanthalneigung (positiv/negativ?)
- Oberlidbelastung
- Augenringe/Hyperpigmentierung
- Augenbrauenposition/-form
- PSL (positive canthal tilt)

4. HAUT
- Akne/Unreinheiten
- Textur/Poren
- Hyperpigmentierung
- Pflegezustand

5. HAARE
- Haarlinie (${userGender === 'male' ? 'Geheimratsecken?' : 'Form/Fülle'})
- Dichte (diffuse Ausdünnung?)
- Styling-Eignung/Potential
- Zustand/Pflege

6. GESAMTAUSSTRAHLUNG
- Körperfettanteil (sichtbar im Gesicht)
- Gesichtszüge-Harmonie
- ${userGender === 'male' ? 'Maskulinität der Features' : 'Feminität/Ausdrucksstärke'}

POTENZIAL-BERECHNUNG:
Zeige auch das ERREICHBARE POTENZIAL (mit Arbeit) als Score-Range.`;

    const userPrompt = `Analysiere diese Fotos EXTREM KRITISCH und DETAILLIERT. Sei UNGESCHÖNT und BRUTAL EHRLICH.
${userGender ? `\nGeschlecht: ${userGender === 'male' ? 'Männlich' : 'Weiblich'}` : ''}
${userCountry ? `Herkunft: ${userCountry}` : ''}

WICHTIG - SEI STRENG:
- KEIN Mitleid - die Person will die WAHRHEIT, nicht Komplimente
- Ein Score von 6+ ist bereits ÜBERDURCHSCHNITTLICH - vergib das nicht leichtfertig!
- Wenn jemand durchschnittlich aussieht, gib 5.0-5.4, NICHT höher
- Keine generischen Aussagen wie "gutes Gesicht"
- Konkret benennen WAS schlecht ist und WARUM
- Teil-Scores für jeden Bereich vergeben (auch hier STRENG!)
- Die Top-3 Schwächen klar priorisieren nach IMPACT
- Konkrete, umsetzbare Verbesserungsvorschläge
- Zeige AKTUELLER SCORE → ERREICHBARES POTENZIAL

Beispiel für SCHLECHTE Aussage: "Könnte Haut verbessern"
Beispiel für GUTE Aussage: "Aktive Akne an Kinn und Wangen (ca. 5-7 Läsionen), deutliche Postakne-Hyperpigmentierung. Score: 4.2/10"

DENKE DRAN: Du bist STRENGER als der Durchschnitt. Ein normales Gesicht = Score 5.0-5.4. Nicht höher!`;


    const messages = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: [
          { type: "text", text: userPrompt },
          ...photoDataUrls.map(url => ({
            type: "image_url",
            image_url: { url }
          }))
        ]
      }
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit the completed critical face/body analysis with sub-scores",
              parameters: {
                type: "object",
                properties: {
                  looks_score: { 
                    type: "number", 
                    description: "Overall looks score from 1.0 to 10.0 (streng kalibriert, Durchschnitt ist 5)" 
                  },
                  strengths: { 
                    type: "array", 
                    items: { type: "string" }, 
                    description: "2-4 spezifische Stärken mit konkreten Details" 
                  },
                  weaknesses: { 
                    type: "array", 
                    items: { type: "string" }, 
                    description: "3-5 spezifische Schwächen, klar und direkt benannt" 
                  },
                  priorities: { 
                    type: "array", 
                    items: { type: "string" }, 
                    description: "Top 3 Verbesserungen priorisiert nach Impact mit konkreten Maßnahmen" 
                  },
                  detailed_analysis: {
                    type: "object",
                    properties: {
                      face_symmetry: { 
                        type: "object",
                        properties: {
                          score: { type: "number", description: "Score 1-10" },
                          details: { type: "string", description: "Spezifische Beobachtungen zu Symmetrie-Abweichungen" },
                          issues: { type: "array", items: { type: "string" }, description: "Konkrete Probleme" }
                        }
                      },
                      jawline: { 
                        type: "object",
                        properties: {
                          score: { type: "number", description: "Score 1-10" },
                          details: { type: "string", description: "Bewertung von Definition, Fettanteil, Projektion" },
                          issues: { type: "array", items: { type: "string" }, description: "Konkrete Probleme" }
                        }
                      },
                      eyes: { 
                        type: "object",
                        properties: {
                          score: { type: "number", description: "Score 1-10" },
                          details: { type: "string", description: "Kanthalneigung, Lider, Augenringe, Brauen" },
                          issues: { type: "array", items: { type: "string" }, description: "Konkrete Probleme" }
                        }
                      },
                      skin: { 
                        type: "object",
                        properties: {
                          score: { type: "number", description: "Score 1-10" },
                          details: { type: "string", description: "Textur, Unreinheiten, Pflegezustand" },
                          issues: { type: "array", items: { type: "string" }, description: "Konkrete Probleme" }
                        }
                      },
                      hair: { 
                        type: "object",
                        properties: {
                          score: { type: "number", description: "Score 1-10" },
                          details: { type: "string", description: "Haarlinie, Dichte, Styling" },
                          issues: { type: "array", items: { type: "string" }, description: "Konkrete Probleme" },
                          recommendation: { type: "string", description: "Frisur-Empfehlung falls nötig" }
                        }
                      },
                      overall_vibe: { 
                        type: "object",
                        properties: {
                          score: { type: "number", description: "Score 1-10" },
                          details: { type: "string", description: "Gesamteindruck, Körperfett, Harmonie" },
                          body_fat_estimate: { type: "string", description: "Geschätzter Körperfettanteil falls erkennbar" }
                        }
                      }
                    },
                    description: "Detaillierte Analyse mit Teil-Scores für jeden Bereich"
                  }
                },
                required: ["looks_score", "strengths", "weaknesses", "priorities", "detailed_analysis"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "submit_analysis" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI Gateway error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    logStep("AI response received", { hasChoices: !!aiData.choices });

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "submit_analysis") {
      throw new Error("Invalid AI response format");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    logStep("Analysis result parsed", { score: analysisResult.looks_score });

    // Update the analysis record with results
    const { error: updateError } = await supabaseClient
      .from('analyses')
      .update({
        status: 'completed',
        looks_score: analysisResult.looks_score,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        priorities: analysisResult.priorities,
        detailed_results: analysisResult.detailed_analysis || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`);
    }
    logStep("Analysis completed and saved");

    return new Response(JSON.stringify({ 
      success: true, 
      analysisId,
      looks_score: analysisResult.looks_score 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    try {
      const { analysisId } = await req.clone().json();
      if (analysisId) {
        await supabaseClient
          .from('analyses')
          .update({ status: 'failed' })
          .eq('id', analysisId);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
