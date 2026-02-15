import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { photoBase64, gender, country } = await req.json();

    if (!photoBase64) {
      return new Response(JSON.stringify({ error: "No photo provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du bist ein erfahrener Dermatologe und Hauttyp-Analyst. Analysiere das Foto und bestimme den Hauttyp der Person.

Antworte NUR mit einem JSON-Objekt im folgenden Format:
{
  "skinType": "oily" | "dry" | "combination" | "normal" | "sensitive",
  "skinTypeName": "Ölige Haut" | "Trockene Haut" | "Mischhaut" | "Normale Haut" | "Empfindliche Haut",
  "confidence": 0.0-1.0,
  "characteristics": ["Eigenschaft 1", "Eigenschaft 2", "Eigenschaft 3"],
  "recommendations": [
    {"category": "Reinigung", "product": "Produktname", "reason": "Warum"},
    {"category": "Feuchtigkeitspflege", "product": "Produktname", "reason": "Warum"},
    {"category": "Sonnenschutz", "product": "Produktname", "reason": "Warum"}
  ],
  "tips": ["Tipp 1", "Tipp 2", "Tipp 3"]
}

Berücksichtige Geschlecht (${gender || "unbekannt"}) und Region (${country || "unbekannt"}) bei deinen Empfehlungen.
Antworte auf Deutsch.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analysiere den Hauttyp dieser Person anhand des Fotos." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${photoBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const skinAnalysis = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(skinAnalysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Skin type analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
