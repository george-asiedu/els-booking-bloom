import { LegalPage } from "./LegalPage";
import { LEGAL, PLATFORM } from "@/config/platform";

const Refunds = () => (
  <LegalPage
    title="Refund Policy"
    updated={LEGAL.updated}
    intro={
      <>
        Two different kinds of payment are covered here: what customers pay a studio or shop for a booking or
        an order, and what studios pay {PLATFORM.name} for the platform. The key point: {PLATFORM.name} never
        holds the money customers pay. Paystack settles it to the studio's own account, so a customer's refund
        always comes from the studio, not from {PLATFORM.name}.
      </>
    }
    sections={[
      {
        heading: "1. Customers: bookings, orders, bills and gift cards",
        body: [
          "Each studio or shop sets its own cancellation, refund and delivery policy and publishes it on its Policies page, linked from the bottom of its website. Read it before you book or pay: that policy applies to your purchase.",
          "To ask for a refund or to cancel:",
          "- Open your booking or order in your account and send a cancellation request, or contact the studio with your booking or order number and the reason. A guest can use the studio's contact details.",
          "- The studio decides, and tells you whether you will be refunded, how much, and when.",
          "- If the studio agrees, it pays you back through the dashboard or itself, by the way you paid (Mobile Money, card, bank) or in cash. The time it takes depends on the studio and on your bank or Mobile Money provider.",
          "A deposit, a no-show, a service already provided, a product already used, and a gift card or package already used are for the studio's policy to decide. Ask the studio whether any payment processing fee you paid on top can be returned.",
          "A product that arrives damaged, wrong or not at all: contact the studio straight away. The studio is responsible for delivery and for putting it right.",
          `If you cannot reach the studio or you are not happy with its answer, write to us at ${PLATFORM.email}. We can pass on your message and share the booking or order record, but we cannot refund you ourselves, because we do not hold the money.`,
          "If a payment on your card was taken without your permission, tell your bank or card provider, and tell the studio and us.",
        ],
      },
      {
        heading: "2. Studios: what you pay Zuri",
        body: [
          "- Setup fee: not refundable.",
          "- Plan subscriptions (monthly or yearly): not refundable once the period has started, whether or not you use it. You can stop renewing at any time, and the plan runs until the end of the period you paid for.",
          "- Extra storage: you can stop it at any time. It ends with the month you paid for and that month is not refunded.",
          "- Features built for you and in-person training: the fee is shown to you first, and you can withdraw before the work starts. If Zuri cannot deliver what you paid for, it is refunded in full.",
          "- Reactivation fee: charged to bring a suspended account back, and not refundable.",
          "If we charge you by mistake or twice, or take a payment we should not have, we refund it in full to the way you paid. Contact us within 30 days of the charge. The law may give you other rights, and nothing here takes them away.",
        ],
      },
      {
        heading: "3. Contact",
        body: [
          `${LEGAL.operator}, ${LEGAL.address}`,
          `Email: ${PLATFORM.email}`,
          `Phone: ${LEGAL.phoneDisplay}  ·  WhatsApp: ${LEGAL.whatsappDisplay}`,
        ],
      },
    ]}
  />
);

export default Refunds;
