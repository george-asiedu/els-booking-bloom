import { LegalPage } from "./LegalPage";
import { PLATFORM } from "@/config/platform";

const Terms = () => (
  <LegalPage
    title="Terms of Service"
    updated="2026"
    intro={
      <>
        These Terms govern your access to and use of {PLATFORM.name} (the
        “Platform”), which lets beauty studios take bookings, sell products and
        accept payments. By subscribing to a plan you agree to these Terms.
      </>
    }
    sections={[
      {
        heading: "1. Accounts",
        body: [
          "When you create a studio you are responsible for the information you provide and for keeping your login credentials secure.",
          "You must be authorised to operate the business you register on the Platform.",
        ],
      },
      {
        heading: "2. Subscriptions & billing",
        body: [
          `${PLATFORM.name} is offered on Standard and Premium plans, billed monthly or yearly. Your subscription renews automatically each period until cancelled.`,
          "Fees are charged in advance and are non-refundable except where required by law. If a renewal payment fails, your studio may be suspended until payment is made.",
          "You can change or cancel your plan from your dashboard; changes take effect according to your billing cycle.",
        ],
      },
      {
        heading: "3. Payments to studios",
        body: [
          "Payments from your customers are processed by our payment provider and settled to the payout account you connect. You are responsible for the accuracy of your payout details and for any taxes on your income.",
          `${PLATFORM.name} may deduct a platform fee from transactions as disclosed to you.`,
        ],
      },
      {
        heading: "4. Acceptable use",
        body: [
          "You agree not to use the Platform for unlawful purposes, to upload content you do not have the rights to, or to attempt to disrupt the service.",
        ],
      },
      {
        heading: "5. Content",
        body: [
          "You retain ownership of the content you upload (logos, images, text). You grant us a licence to host and display it as needed to provide the service.",
        ],
      },
      {
        heading: "6. Termination",
        body: [
          "You may cancel at any time. We may suspend or terminate accounts that breach these Terms or for non-payment.",
        ],
      },
      {
        heading: "7. Liability",
        body: [
          "The Platform is provided “as is”. To the extent permitted by law, we are not liable for indirect or consequential losses.",
        ],
      },
      {
        heading: "8. Contact",
        body: [`Questions about these Terms? Email us at ${PLATFORM.email}.`],
      },
    ]}
  />
);

export default Terms;
