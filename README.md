# NEXT15 Eq BOILERPLATE

This project is a Next.js 15 boilerplate featuring:

- **Page Router:** Utilizes Next.js 15's page routing system.
- **Internationalization:** Supports both Arabic and English languages.
- **UI Components:** Integrated with [shadcn/ui](https://ui.shadcn.com/) for modern, customizable components.
- **Backend Integration:** Uses [Supabase](https://supabase.com/) for authentication and database services.

## Features

- Fast and scalable frontend architecture
- Easy language switching (Arabic/English)
- Ready-to-use UI components
- Secure and flexible backend connectivity

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure Supabase credentials.
4. Run the development server: `npm run dev`

## SEO and Indexing

This boilerplate ships with safe defaults to prevent accidental indexing during development:

- In development and non-production environments, pages are marked `noindex, nofollow` automatically.
- In production (`NODE_ENV=production` or `NEXT_PUBLIC_VERCEL_ENV=production`), indexing is allowed by default.

You can explicitly disable indexing in any environment by setting the following environment variable:

- `NEXT_PUBLIC_DISABLE_INDEXING=true`

For sitemaps and robots.txt, set your public site URL so generated links are correct:

- `NEXT_PUBLIC_SITE_URL=https://your-domain.com`

The sitemap and robots.txt are generated at build time via `next-sitemap` (see `next-sitemap.config.cjs`).
