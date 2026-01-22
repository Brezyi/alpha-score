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
    logStep("Analysis fetched", { status: analysis.status, photoCount: analysis.photo_urls?.length });

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

    // ====== STEP 2: Main AI Analysis ======
    const systemPrompt = `Du bist ein Experte für Gesichts- und Körperanalyse. Analysiere die hochgeladenen Fotos objektiv und professionell.

Bewerte folgende Aspekte:
- Gesichtssymmetrie
- Jawline/Kieferpartie
- Augen und Augenbrauen
- Hautbild
- Haare und Haarstyling
- Körperproportionen (falls Körperfoto vorhanden)

Gib eine ehrliche, aber konstruktive Bewertung ab. Fokussiere auf verbesserbare Aspekte.`;

    const userPrompt = `Analysiere diese Fotos und gib folgendes zurück:
1. Einen Looks Score von 1-10 (mit einer Dezimalstelle, z.B. 7.3)
2. 3-5 Stärken (was gut aussieht)
3. 3-5 Schwächen/Verbesserungspotenzial
4. 3-5 priorisierte Empfehlungen (was sollte zuerst verbessert werden)

Sei ehrlich aber respektvoll. Fokussiere auf Dinge, die verbessert werden können.`;

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
              description: "Submit the completed face/body analysis with scores and recommendations",
              parameters: {
                type: "object",
                properties: {
                  looks_score: { type: "number", description: "Overall looks score from 1.0 to 10.0" },
                  strengths: { type: "array", items: { type: "string" }, description: "List of 3-5 positive aspects/strengths" },
                  weaknesses: { type: "array", items: { type: "string" }, description: "List of 3-5 areas for improvement" },
                  priorities: { type: "array", items: { type: "string" }, description: "Prioritized list of 3-5 recommendations" },
                  detailed_analysis: {
                    type: "object",
                    properties: {
                      face_symmetry: { type: "string" },
                      jawline: { type: "string" },
                      eyes: { type: "string" },
                      skin: { type: "string" },
                      hair: { type: "string" },
                      body: { type: "string" }
                    },
                    description: "Detailed analysis of each aspect"
                  }
                },
                required: ["looks_score", "strengths", "weaknesses", "priorities"]
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
