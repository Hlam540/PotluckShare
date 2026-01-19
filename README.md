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

## How to use
1) Open the landing page and create an event.
2) Copy the event link and share it with your group.
3) Add categories, then add items people should bring.
4) Anyone with the link can claim an item or edit their name.
