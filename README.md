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

For the production Vercel deployment, set the build environment variable to the Render custom domain:

```sh
VITE_API_URL="https://api.zuristudios.com/api"
```

The Vercel security headers allow this API host for browser connections.

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

## Transaction documents

The storefront currently generates customer-facing A4 PDF documents from the data already returned by the ELS-Server API. `src/lib/receipt.ts` contains the shared PDF header, status treatment, branding fallback, and document builders. Account pages and Paystack callback screens call these builders; payment verification and business rules remain in the API/backend.

- **Booking document:** available for upcoming and recent past appointments, including unpaid requests, cancellations, and completions. It reports booking status separately from payment status and includes only appointment/payment fields available in `AppointmentDTO`.
- **Booking payment receipt:** available after a successful payment. Supports full and partial payments, remaining balance, payment method/reference, and booking status when sourced from an appointment.
- **Shop order receipt:** uses an order-oriented layout with products, fulfillment, subtotal, delivery, discount, total, paid amount when the order is paid, and order status.
- **Branding:** account and callback generated PDFs use the active studio name and configured primary color, falling back to Zuri Studios styling where unavailable.

These documents are PDF downloads, not HTML email templates. Transactional email uses the separate server-side notification template and dispatch flow in `ELS-Server/src/notifications`; the frontend does not send or redesign those emails. The current API does not provide enough data to create truthful refund, settlement, subscription, failure-detail, QR verification, or onboarding documents, so those document types are not implemented here. Add them when their corresponding API records and customer-facing references are available.
