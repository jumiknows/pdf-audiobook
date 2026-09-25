# Security

PDF Audiobook stores private user documents in Supabase. Treat authentication, Row Level Security, storage policies, and Edge Function authorization as security-sensitive.

## Do not commit or post

- Supabase service-role keys
- user access tokens or refresh tokens
- private PDFs or extracted document text
- database dumps containing user documents
- credentials from local environment files

The Supabase browser key is public client configuration. It is not a substitute for Row Level Security or authorization checks.

## Reporting

If a vulnerability could expose another user's documents, authentication tokens, or storage objects, report it privately to the repository owner instead of posting the sensitive material publicly.

Use synthetic files and accounts when reproducing security issues.
