# Contributing

PDF Audiobook handles user accounts and uploaded documents. Use synthetic or public test PDFs and keep changes reviewable.

## Local checks

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

## Workflow

Create one focused branch per change and use clear pull request titles such as:

```text
fix: use authenticated session for edge function calls
feat: add document deletion confirmation
docs: clarify Supabase storage policies
```

Call out changes to authentication, Row Level Security, storage policies, Edge Functions, or document handling.

Do not attach private PDFs, access tokens, service-role keys, or real user data to issues or pull requests.
