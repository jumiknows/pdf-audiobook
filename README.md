# PDF Audiobook Converter

Transform PDFs into audio summaries that you can listen to on the go. This application extracts text from PDFs, generates intelligent summaries using extractive AI, and uses browser text-to-speech to read them aloud with synchronized highlighting.

## Features

- **User Authentication** - Secure registration and login with Supabase Auth
- **PDF Upload** - Upload and store PDF documents in Supabase Storage
- **Automatic Text Extraction** - Client-side PDF text extraction using PDF.js
- **Smart Summarization** - Extractive AI summarization with customizable length
- **Audio Playback** - Browser text-to-speech with real-time highlighting
- **Position Memory** - Resume listening from where you left off
- **Document Management** - View, play, and delete your uploaded documents

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **PDF.js** for client-side PDF handling
- **Web Speech API** for text-to-speech

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage for PDF files
  - Edge Functions for serverless processing
  - Row Level Security (RLS)

## Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Vite App)    │
└────────┬────────┘
         │
         │ Supabase Client SDK
         │
┌────────▼────────────────────────────┐
│         Supabase Platform           │
│  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │  PostgreSQL  │   │
│  └──────────┘  │   Database   │   │
│  ┌──────────┐  └──────────────┘   │
│  │ Storage  │  ┌──────────────┐   │
│  │  (PDFs)  │  │    Edge      │   │
│  └──────────┘  │  Functions   │   │
│                 └──────────────┘   │
└────────────────────────────────────┘
```

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - [Sign up for free](https://supabase.com)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/pdf-audiobook.git
cd pdf-audiobook
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details
4. Wait for the database to be set up

### 3. Set Up Database Schema

The database schema is already defined in migration files. To apply it:

1. In your Supabase project dashboard, go to the SQL Editor
2. Run the migrations in `supabase/migrations/` in order:
   - `20251203101427_create_pdf_audiobook_schema.sql`
   - `20251203102957_add_full_text_column.sql`

Or use the Supabase CLI:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 4. Set Up Storage

1. In Supabase Dashboard, go to **Storage**
2. Create a new bucket called `pdfs`
3. Set the bucket to **Private**
4. Add storage policies:

```sql
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Deploy Edge Functions

Deploy the required edge functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref your-project-ref

# Deploy functions
npx supabase functions deploy extract-pdf-text
npx supabase functions deploy summarize-text
```

### 6. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env
```

Configure your `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under **API**.

### 7. Install Dependencies and Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Usage Guide

### 1. Create an Account

- Click "Sign Up" on the landing page
- Enter your email and password (min 6 characters)
- Click "Create Account"

### 2. Upload a PDF

- Click the "Upload PDF" button
- Enter a title for your document
- Select a PDF file
- Click "Upload"
- Text extraction and summarization happen automatically

### 3. Listen to Your Document

- Click on a processed document card (shows "AI Summary Ready")
- Choose your preferred voice from the dropdown
- Click the "Play" button to start audio playback
- Text highlights as it's being read
- Use Pause/Resume to control playback

### 4. Adjust Summary Length

- Click "Short", "Medium", or "Long" buttons on a document card
- The summary will be regenerated at your preferred length
- Different lengths provide different levels of detail

### 5. Manage Documents

- Click the trash icon to delete a document
- Click "Back to Library" to return to document list
- Click "Sign Out" to logout

## Database Schema

### documents table

```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to auth.users)
- title: text
- original_filename: text
- file_path: text (path in storage)
- full_text: text (extracted PDF text)
- summary_text: text (AI-generated summary)
- text_length: integer
- current_position: integer (audio playback position)
- processing_status: text (completed, processing, failed)
- created_at: timestamptz
- updated_at: timestamptz
```

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own documents
- Users can only upload/modify/delete their own files
- All operations require authentication

## Edge Functions

### summarize-text

Generates extractive summaries from text using keyword frequency analysis.

**Endpoint:** `/functions/v1/summarize-text`

**Method:** POST

**Body:**
```json
{
  "text": "Full document text...",
  "maxLength": 500
}
```

**Response:**
```json
{
  "summary": "Generated summary text...",
  "method": "extractive"
}
```

### extract-pdf-text

Extracts text content from PDF files (currently unused - text extraction happens client-side).

## Project Structure

```
pdf-audiobook/
├── supabase/
│   ├── functions/
│   │   ├── extract-pdf-text/     # PDF text extraction edge function
│   │   └── summarize-text/       # AI summarization edge function
│   └── migrations/                # Database schema migrations
│       ├── 20251203101427_create_pdf_audiobook_schema.sql
│       └── 20251203102957_add_full_text_column.sql
│
├── src/
│   ├── components/
│   │   ├── AudioPlayer.tsx        # Audio playback UI with highlighting
│   │   ├── AuthForm.tsx           # Login/register form
│   │   ├── DocumentLibrary.tsx    # Document list and management
│   │   └── UploadModal.tsx        # PDF upload modal
│   ├── hooks/
│   │   └── useSpeechSynthesis.ts  # Text-to-speech hook
│   ├── lib/
│   │   ├── api.ts                 # API client functions
│   │   └── supabase.ts            # Supabase client setup
│   ├── utils/
│   │   └── pdfProcessor.ts        # Client-side PDF utilities
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global styles
│
├── .env                           # Environment variables (not in git)
├── .env.example                   # Environment template
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## How It Works

### Authentication Flow

1. User registers → Supabase Auth creates user account
2. User logs in → Supabase returns session token
3. Client stores session in localStorage (handled by Supabase SDK)
4. All API calls include session token automatically
5. RLS policies enforce data isolation per user

### Document Processing Flow

1. **Upload**: User selects PDF → Client sends to Supabase Storage
2. **Extraction**: Client extracts text using PDF.js library
3. **Storage**: Document metadata saved to PostgreSQL
4. **Summarization**: Edge function generates extractive summary using keyword analysis
5. **Playback**: Client uses Web Speech API to read summary with synchronized highlighting

### Summarization Algorithm

The extractive summarization algorithm:

1. Splits text into sentences
2. Calculates word frequency (excluding stop words)
3. Scores each sentence based on:
   - Word importance (frequency)
   - Position in document (earlier = higher score)
   - Length penalty (too short/long = lower score)
4. Selects top-scoring sentences
5. Reorders by original position for coherence
6. Returns summary at requested length

## Deployment

### Frontend Deployment (Netlify/Vercel)

1. Push code to GitHub
2. Connect repository to Netlify or Vercel
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Supabase (Backend)

Your Supabase project is already hosted and managed. Just ensure:
- Edge functions are deployed
- Database migrations are applied
- Storage bucket is configured
- RLS policies are enabled

### Zero-Cost Deployment

**Complete stack for free:**
- **Netlify/Vercel** - Frontend hosting (free tier)
- **Supabase** - Backend, database, storage, auth (500MB database, 1GB storage on free tier)

**Total Cost:** $0/month for personal projects and small apps

## Troubleshooting

### PDF upload fails

1. Check file is a valid PDF
2. Verify storage bucket is named `pdfs`
3. Check storage policies are configured
4. View browser console for errors

### Text-to-speech not working

1. Web Speech API requires HTTPS (or localhost)
2. Try Chrome browser (best support)
3. Check browser console for errors
4. Verify voices are loaded: `window.speechSynthesis.getVoices()`

### Authentication issues

1. Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
2. Verify email confirmation is disabled in Supabase Auth settings
3. Check browser console for errors
4. Clear localStorage and try again

### Summary generation fails

1. Verify edge functions are deployed
2. Check function logs in Supabase Dashboard
3. Ensure document has extracted text
4. Try regenerating with different length

### Database connection issues

1. Check Supabase project is active
2. Verify RLS policies are configured
3. Check migrations have been applied
4. View logs in Supabase Dashboard

## Security Considerations

- **Row Level Security (RLS)** enforces data isolation per user
- **Storage policies** prevent unauthorized file access
- **Email/password authentication** with Supabase Auth
- **No API keys in client code** - uses Supabase anon key (safe for public use)
- **HTTPS required** in production for Web Speech API
- **File type validation** - PDF only
- **Input sanitization** in edge functions

## Performance

- **Client-side PDF processing** - no server upload delays
- **Edge Functions** - globally distributed, low latency
- **Indexed queries** - fast document retrieval
- **Browser caching** - Supabase SDK caches session
- **Optimistic UI updates** - instant feedback

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues and questions:
- Open an issue on GitHub
- Check Supabase documentation
- Review troubleshooting section above

## Acknowledgments

- Supabase for backend infrastructure
- PDF.js by Mozilla
- React team
- Tailwind CSS
- Web Speech API

---

Built for developers who love turning text into audio
