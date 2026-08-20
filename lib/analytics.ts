import { track } from "@vercel/analytics";

/**
 * Conversion tracking for the marketing site.
 *
 * The site's whole job is turning a visitor into a conversation, and until now
 * there was no way to tell whether that ever happened — not even how many
 * people arrived. These are the three moments that matter:
 *
 *   whatsapp_click  — opened WhatsApp with the prefilled message
 *   email_click     — opened a mail client
 *   brief_submitted — completed the /start form and got a code
 *
 * Vercel Web Analytics is cookieless and stores no cross-site identifier, which
 * is why the privacy notice can say visitors are counted in aggregate. Keep it
 * that way: never pass a name, an email address or a commission code here.
 *
 * Note that custom events (as opposed to page views) require a paid Vercel
 * plan. On the free plan these calls are simply dropped — harmless, and the
 * instrumentation is already in place for when the plan changes.
 */
export type ConversionEvent =
  | "whatsapp_click"
  | "email_click"
  | "brief_submitted";

export function trackConversion(
  event: ConversionEvent,
  props?: { from?: string; tier?: string },
) {
  try {
    track(event, props);
  } catch {
    // Analytics must never break a click. If the script was blocked or failed
    // to load, the visitor still reaches WhatsApp.
  }
}
