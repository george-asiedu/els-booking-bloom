# WhatsApp in Zuri

There are two parts. The first needs nothing from you. The second needs a one-time setup with Meta.

## 1. Click-to-chat (already working, no setup)

Buttons that open WhatsApp with a message already written, using the customer's or the business's number:

- A WhatsApp button on every studio and store website.
- Appointments: message the customer, send a receipt.
- Orders: **Message on WhatsApp** in the order details; the rider link can be sent on WhatsApp.
- Bills: the payment link and QR code can be sent on WhatsApp.
- Gift cards, the Zuri landing page and support links.

These open the person's own WhatsApp and they tap send. Numbers like `024 555 0142` are converted to the international form automatically. Free.

## 2. Automatic WhatsApp messages (needs your setup)

The app can send booking confirmations and reminders (24 hours and 1 hour before) by itself through Meta's WhatsApp Cloud API. It is **off until you set it up**, and each business then switches it on under its Contact page. Meta charges per message conversation.

### What you need to do

1. **Meta Business account:** create one at business.facebook.com and verify your business (documents and a website). Verification can take a few days.
2. **WhatsApp Business Platform:** in Meta for Developers, create an app of type *Business*, then add the *WhatsApp* product.
3. **A phone number** for Zuri to send from. It can't already be on the normal WhatsApp or WhatsApp Business app (or remove it from there first). Add and verify it in WhatsApp Manager. Set the display name (for example "Zuri").
4. **Message templates:** in WhatsApp Manager create two templates in the *Utility* category, English, and get them approved (usually minutes to a day):
   - `booking_confirmed`: variables in order: {{1}} first name, {{2}} business name, {{3}} service, {{4}} date, {{5}} time.
   - `booking_reminder`: the same five, plus {{6}} "tomorrow" or "in about an hour".
   Example: "Hi {{1}}, your {{3}} at {{2}} is booked for {{4}} at {{5}}."
5. **A permanent access token:** in Business Settings create a *System User* (Admin), give it the WhatsApp app, and generate a token with `whatsapp_business_messaging` and `whatsapp_business_management`. Never use the 24-hour test token in production.
6. **Add a payment method** to the WhatsApp Business Account so Meta can bill message costs.

### What I need from you (server settings)

Put these in the server's environment (see `.env.example`):

```
WHATSAPP_TOKEN=<the permanent token>
WHATSAPP_PHONE_NUMBER_ID=<the number's ID from WhatsApp Manager, not the phone number itself>
WHATSAPP_TEMPLATE_CONFIRMED=booking_confirmed
WHATSAPP_TEMPLATE_REMINDER=booking_reminder
WHATSAPP_TEMPLATE_LANGUAGE=en
```

Restart the API. Then, as a business admin, switch **WhatsApp messages** on under the Contact page and book a test appointment with your own number.

### Good to know

- Customers must have a number that works on WhatsApp; messages to others are skipped, and email and push still go out.
- Each booking gets at most one message of each kind, even if the reminder job runs twice.
- Meta only lets a business start a conversation with an approved template. Free-form text is only allowed inside 24 hours after the customer messages you.
- Order updates (out for delivery, ready to collect) by WhatsApp can be added the same way with two more templates. Say if you want that.
