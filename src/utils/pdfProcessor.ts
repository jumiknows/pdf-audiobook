import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}

export function summarizeText(text: string): string {
  const cleanedText = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

  const sentences = cleanedText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.split(' ').length > 5);

  if (sentences.length === 0) {
    return cleanedText.slice(0, 3000);
  }

  const keywordScores = new Map<number, number>();
  const keywords = ['research', 'study', 'result', 'method', 'conclusion', 'finding', 'data', 'analysis', 'significant', 'important', 'novel', 'propose', 'demonstrate', 'show', 'suggest'];

  sentences.forEach((sentence, idx) => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;

    keywords.forEach(keyword => {
      if (lowerSentence.includes(keyword)) score += 2;
    });

    if (idx < 5) score += 3;
    if (idx > sentences.length - 5) score += 2;

    score += Math.min(sentence.split(' ').length / 10, 3);

    keywordScores.set(idx, score);
  });

  const sortedIndices = Array.from(keywordScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.min(40, Math.ceil(sentences.length * 0.4)))
    .map(entry => entry[0])
    .sort((a, b) => a - b);

  const summarySentences = sortedIndices.map(idx => sentences[idx]);
  const summary = summarySentences.join('. ') + '.';

  return summary.length > 50 ? summary : cleanedText.slice(0, 3000);
}
