# REVASSER BD — Multi-Category Ecommerce Platform

**Tagline:** Everything You Love, All in One Place.
**Domain:** https://revasserbd.shop

## Quick Setup
1. Install dependencies: `npm install`
2. For orders, set `ORDERS_SCRIPT_URL` and `ORDERS_SECRET` in `.env.local` (see `order-sheet/README.md`).
3. Run locally: `npm run dev`
4. Push this folder to GitHub and deploy to Vercel, then connect `revasserbd.shop`.

## Admin area (`/admin`)

A separate dashboard for the shop owner, being built in stages. Sign in is with Google, and only
the emails listed in the `ADMIN_EMAILS` setting in Vercel (comma separated) can enter. Never write
those emails in this repository. A sign-in lasts 8 hours. Removing an email from the list locks it
out on the next click (after the new setting is deployed). Admin sessions are signed with a key
made from `ORDERS_SECRET`, so changing that secret signs everyone out.

A changed setting only takes effect after the next deployment.

Adding products and photos in `/admin` needs `GITHUB_TOKEN` in Vercel: a fine-grained GitHub key for
this repository only, with Contents read and write. The live site saves to `main`; a test copy saves
only to its own branch.

Changes made in the admin appear after the rebuild finishes.
