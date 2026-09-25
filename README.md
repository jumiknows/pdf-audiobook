# PDF Audiobook

A React app for turning PDFs into shorter listening sessions.

The app stores documents in Supabase, extracts text in the browser, creates an extractive summary and reads it with the browser's speech API.

## What works

- email and password authentication with Supabase
- private PDF storage
- client-side text extraction with PDF.js
- extractive summaries
- browser text-to-speech
- synchronized text highlighting
- saved listening position
- document deletion
- Supabase row-level security for user documents

## Run it

Requirements:

- Node.js 18 or newer
- a Supabase project

Install and start the app:

```bash
npm ci
cp .env.example .env
npm run dev
```

Set these values in `.env`:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase setup

The database migrations live in:

```text
supabase/migrations/
```

Apply them with the Supabase CLI or SQL editor.

Create a private Storage bucket named `pdfs`.

Deploy the summary function:

```bash
npx supabase functions deploy summarize-text
```

The older `extract-pdf-text` function remains in the repository, but the current app extracts PDF text in the browser.

## Main code

`src/components/AudioPlayer.tsx`

Playback controls and highlighted text.

`src/components/DocumentLibrary.tsx`

Document list and management.

`src/hooks/useSpeechSynthesis.ts`

Browser speech synthesis and playback state.

`src/lib/api.ts`

Authentication, storage, database and summary requests.

`src/utils/pdfProcessor.ts`

Client-side PDF text extraction.

`supabase/functions/summarize-text`

Frequency-based extractive summarization.

## How the summary works

The summary function is deterministic and extractive.

It:

1. splits the document into sentences
2. counts useful word frequencies
3. scores sentences using word frequency, position and length
4. keeps the highest-scoring sentences
5. restores their original order

It is not a large language model and does not rewrite the source text.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Current limits

- text extraction depends on the PDF text layer
- scanned PDFs need OCR before this pipeline can use them
- browser speech quality depends on the voices installed on the device
- the summarizer is intentionally simple
- the repository does not yet have automated tests

The next useful work is adding tests and tightening the server-side authorization around summary requests.
