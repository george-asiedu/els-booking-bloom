// Resource layer over the ELS-Server API.
// Normalizes server payloads (camelCase, UPPER_CASE enums, ISO dates) into the
// snake_case / lowercase shapes the existing components already consume, so the
// migration off Supabase is a drop-in at the data-fetching layer.
//
// Split by domain under src/lib/api/; this barrel keeps every existing
// `@/lib/api` import working. Add new resources as their own module and
// re-export them here. core, models and orders are listed explicitly because
// they also hold helpers (raw shapes, normalizers) that other modules share
// but callers outside src/lib/api have no reason to touch.

export { uploadStudioMedia } from "./core";
export type {
  CursorPage,
  MediaUploadCategory,
} from "./core";
export type {
  ServiceCategory,
  ServiceDTO,
  AppointmentServiceDTO,
  PaymentStatus,
  PaymentType,
  PaymentInfoDTO,
  AppointmentDTO,
} from "./models";
export * from "./auth";
export * from "./studio";
export * from "./platformReviews";
export * from "./billing";
export * from "./promo";
export * from "./featureRequests";
export * from "./services";
export * from "./categories";
export * from "./appointments";
export * from "./profile";
export * from "./account";
export * from "./contact";
export * from "./payments";
export * from "./products";
export * from "./cart";
export { ordersApi } from "./orders";
export type {
  OrderStatus,
  Fulfillment,
  OrderItemDTO,
  OrderDTO,
  CheckoutInput,
  GuestCheckoutInput,
  CheckoutResult,
} from "./orders";
export * from "./commerce";
export * from "./reviews";
export * from "./gallery";
export * from "./businessHours";
export * from "./ledger";
export * from "./refunds";
