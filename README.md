This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment setup

Create a local env file before signing in:

```bash
cp .env.example .env.local
```

Then make sure:

- `DATABASE_URL` points to your Supabase pooler URL (`:6543`)
- `DIRECT_URL` points to your Supabase direct URL (`:5432`)
- `AUTH_SECRET` is set (required for NextAuth in production and recommended in dev)

You can generate a secret with:

```bash
openssl rand -base64 32
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Set these env vars in Vercel (Production + Preview):

- `DATABASE_URL` (Supabase pooler URL)
- `DIRECT_URL` (Supabase direct URL)
- `AUTH_SECRET`
- `CRON_SECRET` (only if you use `/api/cron/recurring`)

Use this build command:

```bash
npx prisma migrate deploy && next build
```

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
