# PotluckShare
PotluckShare is a lightweight, no-account potluck organizer that lets friend groups create an event, claim dishes, and keep a live, shared list through one simple link.

## Development

PotluckShare now runs on Next.js with Postgres-backed API routes.

1) Set `DATABASE_URL` (example: `postgres://user:password@localhost:5432/potluckshare`).
2) `npm install`
3) `npm run dev`

Seed data (optional):
1) `npm run seed`

## Deployment (Vercel)
Set `DATABASE_URL` in your Vercel project environment variables before deploying.
