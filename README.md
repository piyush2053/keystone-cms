# Keystone Control Center

A React + Vite dashboard for the Keystone company owner. It manages organizations and their first administrators, app users, teams, access status and an immutable activity log. Existing mobile/web app features are retained.

## Start

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. On subsequent runs, only `npm run dev` is needed. The BE must be running separately on port 3000. Copy `.env.example` to `.env` only if you need a different backend URL. The development proxy routes `/api/cms` to the BE.

Create the owner on the backend: apply migrations (`001_core.sql`, then the new `002_cms.sql`), set `CMS_OWNER_EMAIL`, `CMS_OWNER_NAME` and `CMS_OWNER_PASSWORD` in **BE/.env**, and run `npm run cms:owner` from BE. Owner login does not need an organization ID. App organization-admin accounts cannot log into this control center.

## Workspace

- Overview: real organization, user and team counts, six-month growth and recent activity.
- Organizations: search, onboard with a first admin, copy generated IDs, edit contact details/plan/notes, suspend and reactivate access.
- People: create users with any supported app role, filter/search, edit accounts, reset passwords, disable and restore access.
- Teams: select an organization, active team lead and members; edit existing teams.
- Activity: owner actions recorded in an append-only backend audit trail.
- Settings: update the owner name and change password with current-password verification.

Onboarding returns generated IDs and shows initial sign-in details once for secure handover. No external invitation emails are sent. Initial passwords are not persisted in browser storage. Owner sessions use HttpOnly cookies; no auth tokens or backend secrets are bundled in this app. Plans are metadata, not a payment integration.

## Production

`npm run build` emits `dist/`. Serve it behind HTTPS with a same-origin `/api/cms` reverse proxy to the BE. Set **BE/.env** `CMS_ORIGIN=https://your-cms-domain.example`.

An optional Dockerfile and Nginx configuration are included:

```sh
docker build -t keystone-cms .
docker run -p 5173:80 -e BACKEND_URL=http://your-backend-host:3000 keystone-cms
```

Configure TLS at your ingress. `BACKEND_URL` in the container is the Nginx upstream; `VITE_API_BASE` (default `/api/cms`) is a public build-time browser setting. Put owner bootstrap credentials only in BE/.env, never in `VITE_*` variables.

Checks: `npm run build`, `npm run lint`. Backend migration, API and credential recovery details: [BE/docs/CMS.md](../BE/docs/CMS.md).
