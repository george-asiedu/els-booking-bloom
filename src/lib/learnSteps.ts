// The Learn course, shared by the Learn page and the Get started box. Each step
// is verified by the API (GET /training/steps) before it counts as done.

export interface Step {
  // Stable id: the API checks it against what the business has really done.
  id: string;
  text: string;
  // What this feature does for the business.
  what: string;
  // What to do, concretely, so the step can be finished.
  doThis: string;
  to?: string;
}
export interface Module {
  title: string;
  minutes: number;
  why: string;
  steps: Step[];
}

// The free online course: short, in the order a new business needs it. Every
// step is proven by the API before it is crossed out.
export const learnModules = (shop: boolean, bookings: boolean): Module[] => [
  {
    title: "Make it yours",
    minutes: 10,
    why: "Customers should see your name, colours and photos from the first visit.",
    steps: [
      {
        id: "branding",
        text: "Add your logo and pick your colours",
        what: "Your logo and colours appear on your site, your emails and your receipts, so customers recognise you.",
        doThis: "Open Appearance, upload your logo, pick a main colour and save.",
        to: "/admin/appearance",
      },
      {
        id: "contact",
        text: "Fill in your contact details",
        what: "Customers use these to reach you, and they show on your site and in your emails.",
        doThis: "Open Contact, add your phone, WhatsApp, email or address, and save.",
        to: "/admin/contact",
      },
      ...(bookings
        ? [
            {
              id: "hours",
              text: "Set the days and hours you take bookings",
              what: "Customers can only book times you are open, so nobody books when you are closed.",
              doThis: "Open Hours, set each day you work (or mark it closed) and save.",
              to: "/admin/hours",
            },
          ]
        : []),
    ],
  },
  ...(bookings
    ? [
        {
          title: "Add what you offer",
          minutes: 15,
          why: "Customers can only book what is listed, with a price and how long it takes.",
          steps: [
            {
              id: "services",
              text: "Add your services with price and duration",
              what: "Services are what customers pick when they book. The duration blocks out the right amount of time.",
              doThis: "Open Services, add one service with its price and how long it takes, and save.",
              to: "/admin/services",
            },
            {
              id: "staff",
              text: "Add your team",
              what: "Customers can choose who they book with, and two people can be booked at the same time.",
              doThis: "Open Staff and add yourself or a team member (even just you).",
              to: "/admin/staff",
            },
            {
              id: "gallery",
              text: "Upload photos of your work to the gallery",
              what: "Photos of your work are the best way to win a new customer. They show on your site.",
              doThis: "Open Gallery and upload at least one photo of your work.",
              to: "/admin/gallery",
            },
          ],
        },
      ]
    : []),
  ...(shop
    ? [
        {
          title: "Set up your shop",
          minutes: 15,
          why: "Products need photos, prices and stock so customers can order with confidence.",
          steps: [
            {
              id: "products",
              text: "Add your products with photos, sizes and colours",
              what: "Products are what customers buy. Sizes, colours and stock stop you selling what you do not have.",
              doThis: "Open Products and add one product with a photo, a price and its stock.",
              to: "/admin/products",
            },
            {
              id: "delivery",
              text: "Choose pickup or delivery, and set delivery areas and times",
              what: "This tells customers how they can get their order, and what delivery costs in each area.",
              doThis: "Open Commerce settings, choose pickup and/or delivery, add your areas and save.",
              to: "/admin/commerce",
            },
            {
              id: "offers",
              text: "Create a coupon or schedule a sale",
              what: "Coupons and sales bring customers back and move slow stock. A sale can run on chosen days.",
              doThis: "Open Sales and create a coupon code, or schedule a sale.",
              to: "/admin/sales",
            },
          ],
        },
      ]
    : []),
  {
    title: "Get paid",
    minutes: 10,
    why: "Money goes straight to your own account. Set it up once and it just works.",
    steps: [
      {
        id: "payout",
        text: "Connect your payout account",
        what: "Customer payments settle straight into your own account (Mobile Money or bank), not through us.",
        doThis: "Open Payments, enter your Mobile Money or bank details and connect.",
        to: "/admin/payments",
      },
      {
        id: "bills",
        text: "Bill a walk-in with a payment link and QR code",
        what: "A bill lets someone standing in front of you pay by phone, and records the sale.",
        doThis: "Open Bills, create a bill for any amount, and share its link or QR code.",
        to: "/admin/bills",
      },
    ],
  },
  {
    title: "Run your day",
    minutes: 10,
    why: "Know what is coming, move orders along and tell customers without typing messages.",
    steps: [
      ...(bookings
        ? [
            {
              id: "bookings",
              text: "Confirm a booking and use the calendar",
              what: "Confirming tells the customer their time is held, and keeps your calendar accurate.",
              doThis: "Open Appointments and confirm (or complete) a booking. Make a test booking if you have none.",
              to: "/admin/appointments",
            },
          ]
        : []),
      ...(shop
        ? [
            {
              id: "orders",
              text: "Move an order from paid to delivered",
              what: "Each status change tells the customer where their order is, so they stop asking you.",
              doThis: "Open Orders and take an order through preparing to delivered or collected.",
              to: "/admin/orders",
            },
          ]
        : []),
      {
        id: "notifications",
        text: "Turn on notifications on your phone",
        what: "You are told the moment a booking or order comes in, even when the app is closed.",
        doThis: "Open Security on your phone, install the app and allow notifications.",
        to: "/admin/security",
      },
      {
        id: "goal",
        text: "Set a monthly goal",
        what: "Insights tracks your sales against a goal and tells you whether you are on pace.",
        doThis: "Open Insights, enter the amount you want to earn this month and save.",
        to: "/admin/insights",
      },
    ],
  },
];
