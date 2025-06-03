This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

This frontend application uses the top-level `.env` file located at the root of the project for all environment variables. The Next.js configuration is set up to automatically load these variables from the parent directory.

### Environment Variables

The following environment variables are used by the frontend application:

- `NEXT_DATABASE_URL`: PostgreSQL connection string for the NextAuth user database
- `NEXTAUTH_SECRET`: Secret key for NextAuth session encryption
- `NEXTAUTH_URL`: Base URL for NextAuth authentication
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `NEXT_PUBLIC_API_BASE_URL`: Base URL for Next.js API routes (typically http://localhost:3000)
- `BACKTEST_API_URL`: Base URL for the FastAPI backend (typically http://localhost:8000)

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Operations

The Prisma ORM is configured to use the `NEXT_DATABASE_URL` environment variable from the top-level `.env` file.

To generate the Prisma client:

```bash
npm run prisma:generate
```

To run database migrations:

```bash
npm run prisma:migrate
```

To open Prisma Studio:

```bash
npm run prisma:studio
```
