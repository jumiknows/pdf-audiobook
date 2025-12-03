import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  text: string;
  maxLength?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  let text = "";
  let maxLength = 500;

  try {
    const HUGGING_FACE_TOKEN = Deno.env.get("HUGGING_FACE_TOKEN");

    if (!HUGGING_FACE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "HUGGING_FACE_TOKEN environment variable is not set" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body: RequestBody = await req.json();
    text = body.text;
    maxLength = body.maxLength || 500;

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const truncatedText = text.slice(0, 1024);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: truncatedText,
          parameters: {
            max_length: maxLength,
            min_length: Math.min(50, maxLength / 2),
            do_sample: false,
          },
        }),
      }
    );

    if (response.status === 410) {
      const newResponse = await fetch(
        "https://router.huggingface.co/models/facebook/bart-large-cnn",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: truncatedText,
            parameters: {
              max_length: maxLength,
              min_length: Math.min(50, maxLength / 2),
              do_sample: false,
            },
          }),
        }
      );

      if (!newResponse.ok) {
        const errorText = await newResponse.text();
        throw new Error(`Hugging Face API error: ${newResponse.status} - ${errorText}`);
      }

      const newResult = await newResponse.json();
      let summary = "";

      if (Array.isArray(newResult) && newResult.length > 0 && newResult[0].summary_text) {
        summary = newResult[0].summary_text;
      } else if (newResult.error) {
        throw new Error(newResult.error);
      } else {
        throw new Error("Unexpected response format from Hugging Face API");
      }

      return new Response(
        JSON.stringify({
          summary: summary.trim(),
          usedAI: true,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let summary = "";

    if (Array.isArray(result) && result.length > 0 && result[0].summary_text) {
      summary = result[0].summary_text;
    } else if (result.error) {
      throw new Error(result.error);
    } else {
      throw new Error("Unexpected response format from Hugging Face API");
    }

    return new Response(
      JSON.stringify({
        summary: summary.trim(),
        usedAI: true,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating summary:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        summary: text ? text.slice(0, maxLength) + "..." : "Unable to generate summary",
        fallback: true,
        error: errorMessage,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
