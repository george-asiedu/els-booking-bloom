import { LegalPage } from "./LegalPage";
import { LEGAL, PLATFORM } from "@/config/platform";

const Terms = () => (
  <LegalPage
    title="Terms of Service"
    updated={LEGAL.updated}
    intro={
      <>
        These Terms govern your use of {PLATFORM.name}: the software that gives beauty studios and shops
        their own website, with bookings, online shopping, payments and customer records (Zuri Studios and
        Zuri Stores), and every studio or store website built on it. {PLATFORM.name} is provided by{" "}
        {LEGAL.operator}, {LEGAL.address}. They apply to studio and shop owners and their staff
        (“Studios”), and to customers who book, buy or pay on a Studio's website. By creating an account,
        subscribing, or booking, buying or paying on a Studio's website, you agree to them.
      </>
    }
    sections={[
      {
        heading: "1. Who does what",
        body: [
          `${PLATFORM.name} provides the technology. Each Studio is an independent business. A booking or an order is an agreement between the customer and the Studio, and ${PLATFORM.name} is not a party to it.`,
          `${PLATFORM.name} does not provide beauty services, sell or deliver products, set a Studio's prices or policies, or hold anyone's money. Payments are made through Paystack and go to the Studio (see section 5).`,
        ],
      },
      {
        heading: "2. Accounts",
        body: [
          "Studios must give accurate details and be authorised to run the business they register. You are responsible for your login, for your staff's access, and for what happens under your account. Tell us at once if you think someone else has got in.",
          "Customers can book, buy or pay as a guest, or create an account with a Studio to see their bookings, orders, points and receipts.",
        ],
      },
      {
        heading: "3. Plans and what Studios pay Zuri",
        body: [
          "Zuri Studios is offered on the Standard and Premium plans (Premium adds an online shop). Zuri Stores is a shop without bookings. The current prices, and what each plan includes, are shown before you pay and on your Billing page.",
          "Studios choose one of two ways to pay:",
          "- A plan subscription, monthly or yearly. You pay the plan price for the period. A yearly period is charged at the yearly price shown.",
          "- Pay as you earn. There is no plan fee. Zuri keeps the percentage of each customer payment that is shown when you sign up and on your Billing page, taken by Paystack when the payment is made.",
          "A one-time setup fee is added to the first payment of a subscription, so the first payment is the plan price plus the setup fee, and later renewals are the plan price alone. The setup fee is not refundable.",
          "Subscriptions do not renew by themselves. Mobile Money cannot be charged automatically, so you renew from your dashboard before the period ends, and we email you as it gets close. If a plan is not renewed when its period ends, the Studio's website and dashboard may be limited or suspended. A suspended account may pay a reactivation fee on top of the plan to come back. The fee is shown to you first.",
          "Extras are charged only as shown to you first: extra storage (in blocks of 500 MB, billed monthly), features built for you at a fee agreed beforehand, and in-person training. Where an extra is a recurring or unpaid charge, it is added to your next renewal.",
          "We may change prices or plans. We will give notice before a change reaches you, and a change never alters a period you have already paid for.",
          "Fees are not refundable, except where the law requires it, or where we charged you by mistake. See the Refund Policy.",
        ],
      },
      {
        heading: "4. What Studios must do",
        body: [
          "Each Studio is responsible for:",
          "- Accurate services, products, prices, opening hours and availability, and honouring confirmed bookings and orders.",
          "- Providing the services and products it advertises, and any delivery or collection.",
          "- Writing and publishing its own cancellation, refund and delivery policies on its Policies page, and keeping to them.",
          "- Answering customers' questions and complaints, and handling refunds (see section 6).",
          "- Following the law, including licences and tax, and using customers' information only as set out in section 11.",
        ],
      },
      {
        heading: "5. Payments",
        body: [
          "Payments for bookings, deposits, products, gift cards, bills and subscriptions are processed by Paystack Ghana Limited (card and Mobile Money). Paystack's terms and privacy policy apply to those payments, and Paystack decides when money is settled. Mobile Money networks may add their own charges.",
          `${PLATFORM.name} does not hold Studios' money. A customer's payment is settled by Paystack to the Studio's own account, and ${PLATFORM.name}'s share (the setup or subscription fee, or the pay-as-you-earn percentage) is separated when the payment is made. A Studio must give correct payout details. If money is settled to a wrong account because of wrong details, that is the Studio's loss.`,
          "A Studio can choose to have customers pay Paystack's processing fee on top of the price. Any such fee is shown to the customer before they pay.",
          "The Studio is responsible for chargebacks, reversals, fines and fraud on its own payments, and must answer a dispute quickly (Paystack allows very little time). If Paystack recovers such an amount from Zuri, we may recover it from the Studio, and may limit or suspend payments while a dispute or investigation is open.",
          "Never ask a customer for a Mobile Money PIN, a card's security code or a one-time code. Studios must not use Zuri to take payments for anything unlawful or for businesses Paystack does not allow.",
          "Each Studio is responsible for its own taxes.",
        ],
      },
      {
        heading: "6. Bookings, orders, bills and gift cards",
        body: [
          "A booking is confirmed when the Studio confirms it or the required payment is made. Deposits, cancellation notice and no-show rules are the Studio's, and are shown on its Policies page.",
          "A Studio can send a walk-in customer a bill with a payment link and QR code, and can record a bill paid in cash, by Mobile Money to its own number, or by card machine. A bill paid online is paid to the Studio through Paystack. Gift cards, packages, coupons and loyalty points are offered and honoured by the Studio that issues them; each Studio sets their rules.",
          `Refunds are always made by the Studio, never by ${PLATFORM.name}, because ${PLATFORM.name} does not hold the money. A Studio can refund through its dashboard where that is offered, or pay the customer back itself and record it. Customers should ask the Studio. See the Refund Policy.`,
          "Delivery is arranged by the Studio. A Studio may share an order's delivery address, phone number and items with a rider through a private link, and a customer's four-digit handover code confirms delivery.",
        ],
      },
      {
        heading: "7. Reviews, photos and other content",
        body: [
          "Customers can post reviews and photos where a Studio allows it. Post only what is true and what you have the right to share. We can remove content that breaks these Terms or the law. Studios must not fake or buy reviews.",
          "Studios keep ownership of what they upload (logos, photos, text, products). They give Zuri permission to store, display and back it up as needed to run their website and the platform.",
          "Photos and videos use the Studio's storage allowance (500 MB or 1 GB, depending on the plan, plus any extra blocks the Studio adds). A deleted photo stays in the Studio's trash for 30 days before it is removed for good. When a Studio is over its allowance, new uploads can be refused.",
          `${PLATFORM.name} owns its software, design and trademarks.`,
        ],
      },
      {
        heading: "8. Messages and insights",
        body: [
          `${PLATFORM.name} sends booking and order emails, push notifications and, where a Studio turns it on, WhatsApp messages (confirmations, reminders and updates). They are sent for the Studio and the customer's own booking or order. Studios must not use them for spam.`,
          `${PLATFORM.name} works out summaries from a Studio's own data (money in and out, customers who have gone quiet, busy hours, promotion results) and can email them to the owner. They are a guide to help you decide, not financial advice.`,
        ],
      },
      {
        heading: "9. Acceptable use",
        body: [
          "Do not use the platform to break the law, deceive or defraud anyone, spread harmful software, get into another Studio's account or customer records, interfere with how the platform works, abuse bookings, loyalty or referral rewards, or send misleading messages. We can look into suspected breaches and act on them.",
        ],
      },
      {
        heading: "10. Availability and other companies' services",
        body: [
          "We work to keep the platform running but cannot promise it will never be interrupted. Parts of it depend on others, including Paystack, mobile networks, hosting and email providers, and Meta (WhatsApp). Their own terms apply, and we are not responsible for their delays or failures.",
        ],
      },
      {
        heading: "11. Customer information: what Studios and Zuri each do",
        body: [
          "For the customers a Studio serves, the Studio decides why and how their information is used (the Studio is the controller) and Zuri processes it for the Studio, to provide the platform (Zuri is the processor). For Zuri's own purposes, such as running studio accounts, billing, security and legal duties, Zuri is the controller. The Privacy Policy explains this.",
          "In running the platform for a Studio, Zuri will:",
          "- Use customer information only to provide the platform and as the Studio instructs through the platform.",
          "- Keep it confidential, and let only the people who need it reach it.",
          "- Keep each Studio's information separate from other Studios'.",
          "- Use reasonable technical and organisational security.",
          "- Use the service providers listed in the Privacy Policy, and hold them to the same care.",
          "- Tell the Studio without undue delay if it learns of a breach affecting its customers' information.",
          "- Help the Studio answer customers' requests to see, correct or delete their information.",
          "- Return or delete the Studio's customer information when the Studio leaves (section 12).",
          "Each Studio must have a lawful reason to collect customer information, tell its customers how it is used (its Policies page and our Privacy Policy help), use it only for running its business, protect what it exports, and never use another Studio's customers' information.",
        ],
      },
      {
        heading: "12. Suspension, leaving and your data",
        body: [
          "A Studio can stop using Zuri at any time. Stopping does not refund fees already paid.",
          "We may suspend or end a Studio's account for a serious breach of these Terms, fraud, a threat to the platform's security, a request from Paystack or the law, or because the plan has not been renewed. Where we reasonably can, we will tell you first and give you a chance to fix it.",
          "When a plan ends or an account is closed, the website is switched off. For 30 days the owner can still sign in to view and export their customers, appointments and orders. After that we delete the Studio's data within 90 days of the end, except what we must keep by law or need for our own billing, security and dispute records (for example payment and tax records), which we keep for as long as the law requires.",
        ],
      },
      {
        heading: "13. Liability",
        body: [
          `To the fullest extent the law allows, ${PLATFORM.name} is not liable for indirect or consequential loss, lost profit or lost business. ${PLATFORM.name} is not responsible for disputes between a Studio and its customers about services, products, delivery or refunds.`,
          `Our total liability to a Studio for any claim is limited to the fees that Studio paid ${PLATFORM.name} in the three months before the event. Nothing in these Terms limits liability that cannot lawfully be limited.`,
        ],
      },
      {
        heading: "14. Changes",
        body: [
          "We may update these Terms. The new version is published here with its date, and we will tell Studios by email or in the dashboard when a change matters. Using the platform after a change takes effect means you accept it.",
        ],
      },
      {
        heading: "15. Law and disputes",
        body: [
          "These Terms are governed by the laws of Ghana. Please contact us first and we will try to put things right. If that does not work, disputes go to the courts of Ghana, without affecting any consumer right you have by law.",
        ],
      },
      {
        heading: "16. Contact",
        body: [
          `${LEGAL.operator}, ${LEGAL.address}`,
          `Email: ${PLATFORM.email}`,
          `Phone: ${LEGAL.phoneDisplay}  ·  WhatsApp: ${LEGAL.whatsappDisplay}`,
        ],
      },
    ]}
  />
);

export default Terms;
