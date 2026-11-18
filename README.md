# Keystone web portals

React + Vite app with three sign-ins on the same backend, styled like the Keystone prototype
([../UI](../UI)):

| Route | Who | What |
| --- | --- | --- |
| `#/broker` | Broker / channel partner | Home, Current mandates (filters, transfer one / many / all leads, restart in Fresh), Create mandate (project, agents, Excel/CSV upload by agent column, split or shared pool), Performance (Plus: per agent; Pro: funnel, red flags, feedback), New launches (swipe deck), Profile (personal info, agents and their logins, developer access, plan, agent requests, password) |
| `#/developer` | Developer (property owner) and teammates | Home, shared mandates, view-only performance with KRAs (no client names or numbers), paid campaigns with live estimate and deck preview, profile and teammates |
| `#/admin` | Keystone owner | Onboard brokers, confirm plan and campaign payments, suspend, CP reach per locality, activity |
| `#/` | Everyone | Landing page linking the three products |

Broker logins are created in `#/admin`. Agent and developer logins are created by the broker
(developers can add teammates). Each new login shows its user ID and password once.

There is no payment gateway yet: plan changes and campaigns wait as "payment pending" until the
owner marks them paid. A paid campaign starts in matching brokers' New launches deck at once.

## Start

```sh
npm install
npm run dev          # http://127.0.0.1:5173 (the BE must be running on port 3000)
```

The Vite dev server proxies `/api` to the backend (`BACKEND_URL` in `.env`, default
`http://127.0.0.1:3000`). Set `VITE_APP_URL` to link the tele-caller app from the landing page.

Demo logins after `npm run seed` in BE (password = `SEED_PASSWORD`): broker `amit.kulkarni`,
developer `neha.bhatia`; owner from `OWNER_EMAIL` / `OWNER_PASSWORD` (`npm run owner`).

Sessions are HttpOnly cookies per portal, so the broker and developer sites can be open in two
tabs. Writes carry the `X-Keystone-Request` header. Live updates arrive over Server-Sent Events.

## Production

`npm run build` emits `dist/`. Serve it with a same-origin `/api` reverse proxy to the BE (the
included `nginx.conf` does this; `BACKEND_URL` is the upstream) and add the portal origin to the
backend's `CMS_ORIGIN`.

```sh
docker build -t keystone-cms .
docker run -p 5173:80 -e BACKEND_URL=http://your-backend:3000 keystone-cms
```
