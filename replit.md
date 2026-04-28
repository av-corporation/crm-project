# A V Corporation CRM

React 19 + Vite + Express + Firebase Firestore CRM with shadcn/ui, Tailwind v4, framer-motion.

## Stack
- Frontend: React 19, Vite, Tailwind CSS v4, shadcn/ui, framer-motion
- Backend: Express (server.ts), serves Vite in dev and built assets in prod
- Data: Firebase Firestore (services in `src/services/crmService.ts`)
- Auth: Firebase Auth via `src/contexts/AuthContext`
- Port: 5000 (configured in server.ts)
- Workflow: `Start application` runs `npm run dev`

## Routes
- `/` Dashboard
- `/leads` Leads list (lead detail is a slide-over panel within this page, not a separate route)
- Other CRM pages (kanban, tasks, etc.)

## Theme & Typography
- Default theme is **light** (was dark). Toggle persists in `localStorage.theme`.
- Leads page and Lead Detail panel use a fixed light premium UI (white background, `#5B3FFF` purple primary, soft shadows, 12-16px radius), inspired by HubSpot/NexusCRM.
- **Single font: Inter** (loaded once at the top of `src/index.css`). Both `--font-sans` and `--font-heading` are set to Inter; weights 400/500/600/700 only.
- **Standard typography utilities** (in `src/index.css`):
  - `.page-title` → `text-2xl font-semibold tracking-tight` (every top-of-page heading)
  - `.page-subtitle` → `text-sm text-slate-500 mt-1` (description under page title)
  - `.section-title` → `text-base font-semibold tracking-tight` (every card/section heading)
  - `.section-eyebrow` → `text-[11px] font-medium uppercase tracking-wider text-slate-500`
- All page headers (Dashboard, Leads, Users, Profile) use the same row pattern: title + subtitle on the left, action button(s) on the right, separated from content by a thin border-bottom.

## Navigation & Information Architecture
- Settings page/route is **removed**. The sidebar shows only Dashboard, Leads, Automation (manager+), Users (admin only).
- Avatar dropdown links to **My Profile** (was "Account Settings").
- **All user management lives in `/users`**: Add (with WhatsApp/Email/Copy share-credentials modal), Edit, Delete, Role assignment. Admin-only.
- `/profile` is each user's **own** profile only — read role/username/account meta and edit name/email/mobile.

## Lead Detail Panel (in src/pages/Leads.tsx)
The slide-over panel opens from clicking a lead row. Layout:
- Header: large avatar (initial), name, dynamic Individual/Company badge, location/created/source meta row.
- Action toolbar: Call (outline), WhatsApp (filled green #25D366), Email (outline), 3-dot menu with Edit/Copy/Delete.
- Tabs: Overview / Activity / Notes / Files (only one visible at a time).
- Notes tab: simple textarea ("Add a note..."), Schedule Follow-up toggle, Add Note button, timeline list using `note.note` and `note.createdBy` (matches `Note` type in `src/types/crm.ts`).
- Activity tab: timeline using `log.createdAt` and `log.action` (matches `ActivityLog` type).
- Right sidebar (320px wide): Contact Info card (Name, Phone, Email, Company, Location) and Lead Details card (Status with `StatusSelector` dropdown wired to `handleUpdateStatus`, Source, Requirement, Assigned To, Priority, Created).

## Important Type Mappings
- `Note`: `{ id, leadId, createdBy, note, followUpDate, createdAt }` — NOT `authorId`/`content`.
- `ActivityLog`: `{ id, userId, leadId, action, details, createdAt }` — NOT `timestamp`.

## Key Files
- `src/pages/Leads.tsx` — single large page (table + filters + slide-over detail panel + dialogs).
- `src/components/StatusSelector.tsx` — reusable status dropdown.
- `src/components/Layout.tsx` — sidebar, header, theme toggle (defaults to light).
- `src/services/crmService.ts` — all Firestore subscriptions and mutations.
- `src/types/crm.ts` — Lead, Note, ActivityLog, StatusConfig, UserProfile types.
- `server.ts` — Express + Vite middleware on port 5000.
