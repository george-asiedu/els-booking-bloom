import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { StudioPageHero } from "@/components/storefront/StudioPageHero";
import { useStudio } from "@/hooks/useStudio";
import { useSeo } from "@/lib/seo";
import { contactInfoApi } from "@/lib/api";

/**
 * What a studio's customers need to know before they book or pay: its own
 * cancellation, refund and delivery policies (or the standard wording until it
 * writes them), who to contact, and how payments and personal data are handled.
 * Paystack asks every merchant to publish these.
 */
const defaultPolicies = (studioName: string) => ({
  cancellationPolicy: `To cancel or move an appointment, ask ${studioName} as early as you can from your account or by contacting us. Whether a deposit is kept, and how much notice is needed, is for ${studioName} to decide when it replies.`,
  refundPolicy: `Refunds are made by ${studioName} itself, to the way you paid (Mobile Money, card, bank or cash). Zuri does not hold your money and cannot refund it. Contact ${studioName} with your booking or order number and the reason, and it will tell you what can be done and how long it will take.`,
  deliveryPolicy: `Delivery areas, fees and times are shown at checkout, and you can see them before you pay. You can also collect your order from ${studioName} when that option is shown. Contact us if an order has not arrived when expected.`,
});

const StudioPolicies = () => {
  const { name: studioName, config, features } = useStudio();
  const { data: info } = useQuery({ queryKey: ["contact-info"], queryFn: () => contactInfoApi.get() });
  useSeo({
    title: `Policies · ${studioName}`,
    description: `Cancellation, refund and delivery policies, contact details and how ${studioName} handles payments and personal information.`,
  });

  const d = defaultPolicies(studioName);
  const content = config?.content;
  const sells = features.commerce !== false;
  const sections = [
    ...(features.booking !== false
      ? [{ title: "Cancellations and rescheduling", text: content?.cancellationPolicy || d.cancellationPolicy }]
      : []),
    { title: "Refunds and returns", text: content?.refundPolicy || d.refundPolicy },
    ...(sells ? [{ title: "Delivery and collection", text: content?.deliveryPolicy || d.deliveryPolicy }] : []),
  ];

  return (
    <Layout>
      <StudioPageHero
        eyebrow="Policies"
        title="Before you book or pay"
        description={`How ${studioName} handles cancellations, refunds and your information.`}
        image={null}
        variant="editorial"
      />
      <section className="py-12">
        <div className="container mx-auto max-w-3xl space-y-10 px-4">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-serif text-2xl font-bold text-foreground">{s.title}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Payments</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Payments are processed by Paystack, by card or Mobile Money, and go straight to {studioName}'s own
              account. Zuri, which provides this website, does not hold your money. We never see or keep your card
              number or Mobile Money PIN. Anything you are charged, including any payment processing fee, is shown
              before you pay.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Contact {studioName}</h2>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              {info?.phone && info.showPhone && <li>Phone: <a className="underline" href={`tel:${info.phone.replace(/\s+/g, "")}`}>{info.phone}</a></li>}
              {info?.email && info.showEmail && <li>Email: <a className="underline" href={`mailto:${info.email}`}>{info.email}</a></li>}
              {info?.address && info.showAddress && <li>Address: {info.address}</li>}
              <li>
                <Link to="/contact" className="underline">All contact details and opening hours</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Your personal information</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {studioName} uses the details you give (name, phone, email, what you booked or bought) to serve you and
              to contact you about it. Zuri stores them for {studioName} and does not sell them. Read the{" "}
              <Link to="/privacy" className="underline">Privacy Policy</Link> and the{" "}
              <Link to="/terms" className="underline">Terms of Service</Link>. To see, correct or delete your
              information, contact {studioName} or email Zuri.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default StudioPolicies;
