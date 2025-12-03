import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import * as pdfjsLib from "npm:pdfjs-dist@4.0.379";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  documentId: string;
  filePath: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { documentId, filePath }: RequestBody = await req.json();

    console.log(`Processing document ${documentId} from ${filePath}`);

    await supabase
      .from("documents")
      .update({ processing_status: "processing" })
      .eq("id", documentId);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("pdfs")
      .download(filePath);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    console.log(`Downloaded file, size: ${fileData.size} bytes`);

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    console.log(`PDF loaded, pages: ${pdf.numPages}`);

    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 100);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => {
          if ("str" in item) {
            return item.str;
          }
          return "";
        })
        .filter((str: string) => str.trim().length > 0)
        .join(" ");

      fullText += pageText + "\n\n";

      if (i % 10 === 0) {
        console.log(`Processed ${i}/${maxPages} pages`);
      }
    }

    fullText = fullText.trim();
    const textLength = fullText.length;

    console.log(`Extracted ${textLength} characters`);

    await supabase
      .from("documents")
      .update({
        full_text: fullText,
        text_length: textLength,
        processing_status: "completed",
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({
        success: true,
        textLength,
        message: "PDF text extracted successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
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
