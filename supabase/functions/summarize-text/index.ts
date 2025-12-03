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

  try {
    const { text, maxLength = 500 }: RequestBody = await req.json();

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

    const model = new Supabase.ai.Session('mistral-7b-instruct-v0.2');

    const truncatedText = text.slice(0, 5000);

    const prompt = `Summarize the following text in a clear and concise way. Keep the summary under ${maxLength} characters:\n\n${truncatedText}`;

    const output = await model.run(prompt, {
      temperature: 0.3,
      max_tokens: 300,
    });

    let summary = '';
    if (output && typeof output === 'object' && 'completion' in output) {
      summary = (output.completion as string).trim();
    } else if (typeof output === 'string') {
      summary = output.trim();
    } else {
      summary = text.slice(0, maxLength) + '...';
    }

    if (summary.length > maxLength + 100) {
      summary = summary.slice(0, maxLength) + '...';
    }

    return new Response(
      JSON.stringify({
        summary,
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
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
