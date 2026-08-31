import { LegalPage } from "./LegalPage";
import { PLATFORM } from "@/config/platform";

const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    updated="2026"
    intro={
      <>
        This Policy explains how {PLATFORM.name} collects, uses and protects
        personal information when you use the Platform as a studio owner or as a
        customer of a studio.
      </>
    }
    sections={[
      {
        heading: "1. Information we collect",
        body: [
          "Account information: name, email, phone and password for studio owners; name, email and phone for customers who book or order.",
          "Business information: your studio details, services, products, images and settings.",
          "Payment information: payments are handled by our payment provider; we store references and status, not full card details.",
          "Usage information: basic analytics about how the Platform is used, to improve the service.",
        ],
      },
      {
        heading: "2. How we use it",
        body: [
          "To provide bookings, orders and payments; to operate your studio's site; to send transactional messages (receipts, confirmations); and to support and improve the Platform.",
        ],
      },
      {
        heading: "3. Sharing",
        body: [
          "We share information with service providers who help us run the Platform (e.g. payment processing, hosting, email delivery) under appropriate safeguards. We do not sell your personal information.",
          "A studio's customer data is accessible to that studio to fulfil bookings and orders.",
        ],
      },
      {
        heading: "4. Payment data",
        body: [
          "Card and mobile-money details are collected and processed directly by our PCI-compliant payment provider. We receive transaction references and outcomes only.",
        ],
      },
      {
        heading: "5. Data retention & security",
        body: [
          "We keep information for as long as needed to provide the service and meet legal obligations, and we apply reasonable technical and organisational measures to protect it.",
        ],
      },
      {
        heading: "6. Your rights",
        body: [
          "You may request access to, correction of, or deletion of your personal information, subject to legal limits. Contact us to make a request.",
        ],
      },
      {
        heading: "7. Contact",
        body: [`For privacy questions, email ${PLATFORM.email}.`],
      },
    ]}
  />
);

export default Privacy;
