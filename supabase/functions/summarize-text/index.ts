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

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'has', 'have', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'this', 'but', 'they', 'can', 'or', 'which',
  'their', 'said', 'there', 'not', 'also', 'had', 'been', 'were', 'would',
  'could', 'should', 'may', 'might', 'must', 'these', 'those', 'some', 'any',
  'all', 'both', 'each', 'few', 'more', 'most', 'other', 'such', 'no', 'nor',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'into', 'about', 'out'
]);

function extractiveSummary(text: string, targetSentences: number = 5): string {
  const sentences = text
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length <= targetSentences) {
    return text;
  }

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const maxFreq = Math.max(...Object.values(wordFreq));
  for (const word in wordFreq) {
    wordFreq[word] = wordFreq[word] / maxFreq;
  }

  const sentenceScores = sentences.map((sentence, index) => {
    const sentenceWords = sentence.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    const wordScore = sentenceWords.reduce((score, word) => {
      return score + (wordFreq[word] || 0);
    }, 0) / sentenceWords.length;

    const positionScore = 1 - (index / sentences.length) * 0.3;

    const lengthPenalty = sentence.length < 30 || sentence.length > 150 ? 0.8 : 1;

    return {
      sentence,
      score: wordScore * positionScore * lengthPenalty,
      index
    };
  });

  sentenceScores.sort((a, b) => b.score - a.score);
  const topSentences = sentenceScores
    .slice(0, targetSentences)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence);

  return topSentences.join(' ');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const text = body.text;
    const maxLength = body.maxLength || 500;

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

    const targetSentences = Math.max(3, Math.min(8, Math.floor(maxLength / 80)));
    const summary = extractiveSummary(text, targetSentences);

    return new Response(
      JSON.stringify({
        summary: summary.trim(),
        method: 'extractive',
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