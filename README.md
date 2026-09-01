# Zuri Studios

**Zuri Studios** is a multi-tenant SaaS platform for beauty businesses. Each studio gets its own branded storefront (custom subdomain) where customers browse services, book appointments (with an optional design reference photo), shop products, leave reviews and earn/redeem loyalty points; the studio admin manages services, appointments, gallery, business hours, reviews, contact details and views analytics, all governed by a super-admin platform console. El's Beauty Studio is one studio hosted on Zuri.

Built with **React + Vite + TypeScript**, **Tailwind CSS** and **shadcn/ui**, talking to the [ELS-Server](../ELS-Server) REST API (Express + Prisma + MongoDB, JWT auth).

## Getting started

```sh
npm install
npm run dev
```

The app runs on <http://localhost:8080>.

## Configuration

Create a `.env` file with the API base URL:

```sh
VITE_API_URL="http://localhost:5000/api"
```

The backend (ELS-Server) must be running for data to load.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Structure

- `src/pages` — public pages (Home, Services, Gallery, Book, Contact, Reviews, auth) and the `admin/` dashboard
- `src/lib/api.ts` — typed client for the ELS-Server API
- `src/components` — layout, admin and shared UI (shadcn/ui in `components/ui`)
- `src/hooks/useAuth.tsx` — JWT auth context
