import { LegalPage } from "./LegalPage";
import { LEGAL, PLATFORM } from "@/config/platform";

const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    updated={LEGAL.updated}
    intro={
      <>
        This Policy explains how {PLATFORM.name} ({LEGAL.operator}, {LEGAL.address}) collects, uses and protects
        personal information when you use the platform as a studio or shop owner, as staff, or as a customer
        of a studio or shop on it. We follow Ghana's Data Protection Act, 2012 (Act 843).
        {LEGAL.dpcRegistrationNumber
          ? ` We are registered with the Data Protection Commission (registration number ${LEGAL.dpcRegistrationNumber}).`
          : ""}
      </>
    }
    sections={[
      {
        heading: "1. Who is responsible for what",
        body: [
          `${PLATFORM.name} is a platform that many independent studios and shops use. That means two roles:`,
          `- For the owners and staff who use ${PLATFORM.name}, and for running the platform (billing, security, support and legal duties), ${PLATFORM.name} decides how information is used. We are the controller.`,
          `- For a studio's or shop's customers (the people who book, buy or pay on its website), the studio or shop decides why and how their information is used, and ${PLATFORM.name} handles it for them to run the platform. The studio or shop is the controller and ${PLATFORM.name} is the processor. Each studio's Policies page explains its own practices.`,
          "A studio can only see its own customers, never another studio's.",
        ],
      },
      {
        heading: "2. What we collect",
        body: [
          "Studio owners and staff: name, email, phone, login details (passwords are stored scrambled, never in plain text), the studio's name, web address, logo, photos, services, products, prices, opening hours, plan and billing history, payout details, and the settings and records of how the studio uses the platform.",
          "Customers: name, phone and email; what they booked or bought and when; delivery address and notes for the rider, and the four-digit handover code; payment status and references; gift cards, packages, coupons and loyalty points; reviews, photos and booking notes they choose to add; their message preferences. Customers can book or buy as a guest or with an account.",
          "Technical information: IP address, browser and device type, a device identifier, the pages and actions used, errors, and push notification settings. We use this to keep accounts secure, stop abuse and fix problems.",
          "Payments: we receive the amount, status, reference, time and the payment method type (for example card or Mobile Money) and, for Mobile Money, the phone number and network the customer gives. We do not see or keep card numbers, card security codes or Mobile Money PINs; those go to Paystack.",
        ],
      },
      {
        heading: "3. How we use it",
        body: [
          "- To create and run accounts, websites, bookings, orders, bills and payment links.",
          "- To take payments through Paystack and work out each party's share.",
          "- To send confirmations, receipts, reminders, order and delivery updates, and account and billing notices, by email, push notification and, where the studio turns it on, WhatsApp.",
          "- To give studios their records and summaries, such as who has gone quiet, busy hours and how promotions did.",
          "- To give support, prevent fraud and abuse, and keep the platform secure (including a security check on guest forms).",
          "- To improve the platform, and to meet legal, tax and accounting duties.",
          "We do not sell personal information, and we do not use it for advertising.",
        ],
      },
      {
        heading: "4. Who we share it with",
        body: [
          "The studio or shop a customer books or buys from sees the information needed to serve them: name, contact details, what they ordered, payment status and delivery details.",
          "A delivery rider the studio chooses can open a private link showing the delivery address, phone number, note and items, until the order is delivered.",
          "Companies that help us run the platform, only for that purpose:",
          "- Paystack Ghana Limited: card and Mobile Money payments.",
          "- Cloud hosting and storage: our servers (Contabo, in Germany), Amazon Web Services (photos and files, and content delivery), and a backup copy of the database with Neon (in the United States).",
          "- Plunk: sending email.",
          "- Cloudflare: the Turnstile security check on guest forms and Mobile Money prompts.",
          "- Meta (WhatsApp): only where a studio turns on WhatsApp messages.",
          "- Browser and phone push services (such as those of Google, Apple and Mozilla): delivering push notifications you turn on.",
          "- Google Maps and OpenStreetMap: address and map lookups. YouTube and TikTok: videos a studio chooses to show.",
          "We may disclose information where the law, a court or a regulator requires it, or to protect people from fraud or harm.",
        ],
      },
      {
        heading: "5. Payments and Paystack",
        body: [
          "Payments are processed by Paystack, which may process payment data in Ghana and in other countries, and may keep it as its own privacy policy and the law require. Payments go to the studio's own account. Paystack's privacy policy applies to the information Paystack handles.",
        ],
      },
      {
        heading: "6. Cookies and similar technology",
        body: [
          `${PLATFORM.name} uses only what it needs to work: a sign-in cookie that keeps you signed in to a studio, and browser storage for your basket, your preferences and push settings. We do not use advertising or tracking cookies. Turning off these cookies will stop sign-in and the basket from working.`,
        ],
      },
      {
        heading: "7. Where information is kept",
        body: [
          "Our main servers are in Germany, and photos and files are stored with Amazon Web Services. A backup copy of the database is held in the United States. Paystack, Plunk, Cloudflare and Meta may also process information outside Ghana. When information leaves Ghana, we use providers that protect it and we take the steps the law requires.",
        ],
      },
      {
        heading: "8. Keeping it safe",
        body: [
          "Each studio's information is kept separate from every other studio's. Access is by sign-in, and owners can turn on two-step sign-in. Pages are served over HTTPS, passwords are stored scrambled, and sensitive actions are rate-limited and checked. Access to our servers is limited to the people who need it. No system is completely safe, so keep your password private and tell us at once if you think your account was used by someone else.",
          "If we learn of a breach that affects personal information, we will tell the studio concerned without undue delay and the Data Protection Commission and affected people where the law requires it.",
        ],
      },
      {
        heading: "9. How long we keep it",
        body: [
          "We keep information while an account is active and as long as needed for the purposes above. Studio and customer records stay with the studio until the studio leaves. After a studio's plan ends, its owner has 30 days to view and export its data, and we then delete it within 90 days of the end. We keep what the law requires us to (for example payment and tax records) and what we need for our own billing, security and disputes, for as long as the law requires. A deleted photo stays in the studio's trash for 30 days, then is removed.",
        ],
      },
      {
        heading: "10. Your rights",
        body: [
          "You can ask to see the information we hold about you, to correct it, to have it deleted where the law allows, to object to how it is used, and to withdraw consent you gave. You can also complain to the Data Protection Commission (dataprotection.org.gh).",
          `For a studio's customers, the quickest route is to contact the studio, which holds the booking or order. You can also write to us at ${PLATFORM.email}, and we will pass your request to the studio or deal with it ourselves. We may ask you to prove who you are first, and we will answer within a reasonable time.`,
        ],
      },
      {
        heading: "11. Children",
        body: [
          `${PLATFORM.name} is for businesses and their customers who can make their own bookings and payments. We do not knowingly collect information from children. A studio that serves children must get the permission of a parent or guardian.`,
        ],
      },
      {
        heading: "12. Changes",
        body: [
          "We may update this Policy. The new version is published here with its date, and we will tell studios when a change matters.",
        ],
      },
      {
        heading: "13. Contact",
        body: [
          `${LEGAL.operator}, ${LEGAL.address}`,
          `Email: ${PLATFORM.email}`,
          `Phone: ${LEGAL.phoneDisplay}  ·  WhatsApp: ${LEGAL.whatsappDisplay}`,
        ],
      },
    ]}
  />
);

export default Privacy;
