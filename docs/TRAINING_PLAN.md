# Zuri training plan

**Goal:** a new business can run its site on its own, without us, within a day.

Online training is **free**. In-person training is a **paid request**: the super admin sets the fee, it is added to the business's next bill, and the business is told before anything is booked.

## What a new business gets

| Training | Cost | How |
|---|---|---|
| **Guided steps** in the dashboard (Learn Zuri) | Free | Five short modules with a tick-list, in the order a new business needs them. Progress is remembered on their device. |
| **Live online session** | Free | One recurring session with a join link and time set by the super admin (Platform, Training). Shown on every Learn page. |
| **In-person training** | Fee on request | The business sends a request (when, where, what to focus on). The super admin sets the fee and date; the business is told by notification; the fee appears on its Billing page and is added to its next renewal. A business can have two open requests at a time. |

## The online modules

Shown according to what the business has (a store sees the shop module, a studio the bookings module).

1. **Make it yours** (about 10 min): logo, colours, contact details, opening hours.
2. **Add what you offer** (about 15 min, Zuri Studios): services, team, gallery.
3. **Set up your shop** (about 15 min, shops): products, pickup and delivery areas and times, a first sale.
4. **Get paid** (about 10 min): payout account, who covers the payment fee, billing a walk-in with a link and QR code.
5. **Run your day** (about 10 min): bookings and the calendar, moving orders along, notifications and installing the app, analytics.

## When people hear about it

- **Landing page:** a "We'll teach you. It's free." section under pricing, with the three options above.
- **Welcome email** (sent when a studio or store goes live): a "Free training" block with a link to the Learn page, and a line that in-person training is available for a fee.
- **In the dashboard:** "Learn Zuri" in the menu from day one.

## Running it week to week

1. **Day 0:** the welcome email arrives with the training link.
2. **Day 1:** the owner works through modules 1 and 2 (or 1 and 3). Most are live the same day.
3. **Week 1:** the owner joins the live session with questions. Questions that come up twice become a new step or guide.
4. **Week 2 onwards:** businesses that are stuck (no services or products added, no payout account) get a personal nudge; in-person training is suggested for teams.

## Things to do on your side

- Pick the live session slot, create a standing meeting link (Google Meet or Zoom) and save it under **Platform, Training**.
- Decide the in-person fee (a fixed price, or per half-day plus travel). It is set per request, so it can vary.
- Keep the guides current: the steps live in `src/pages/admin/AdminLearn.tsx`.

## How we'll know it works

- Share of new businesses that have a service or product, a payout account and a first booking or order within 7 days.
- Number of support messages from businesses in their first two weeks (should fall).
- Live session attendance, and which questions repeat.
