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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

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
      // Extract file path from the URL
      const urlParts = url.split('/analysis-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Get signed URL for private bucket access
        const { data: signedData, error: signedError } = await supabaseClient.storage
          .from('analysis-photos')
          .createSignedUrl(filePath, 300); // 5 min expiry

        if (signedError) {
          logStep("Signed URL error", { error: signedError.message, filePath });
          continue;
        }

        if (signedData?.signedUrl) {
          // Fetch and convert to base64
          const imageResponse = await fetch(signedData.signedUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          photoDataUrls.push(`data:${contentType};base64,${base64}`);
          logStep("Photo converted to base64", { filePath });
        }
      }
    }

    if (photoDataUrls.length === 0) {
      throw new Error("No valid photos found for analysis");
    }
    logStep("Photos prepared for analysis", { count: photoDataUrls.length });

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    // Use tool calling for structured output
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
                  looks_score: {
                    type: "number",
                    description: "Overall looks score from 1.0 to 10.0"
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 3-5 positive aspects/strengths"
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 3-5 areas for improvement"
                  },
                  priorities: {
                    type: "array",
                    items: { type: "string" },
                    description: "Prioritized list of 3-5 recommendations"
                  },
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

    // Extract the tool call result
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

    // Try to mark analysis as failed
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
