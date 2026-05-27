import { NextResponse }  from "next/server";
import { Webhook }       from "svix";
import { Resend }        from "resend";
import { WelcomeEmail }  from "@/emails/WelcomeEmail";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClerkEmailAddress {
  id:            string;
  email_address: string;
}

interface ClerkUserCreatedData {
  id:               string;
  first_name:       string | null;
  last_name:        string | null;
  email_addresses:  ClerkEmailAddress[];
  primary_email_address_id: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserCreatedData;
}

// ── POST /api/webhooks/clerk ───────────────────────────────────────────────────

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // ── Verify svix signature ─────────────────────────────────────────────────
  const svixId        = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(rawBody, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Only handle user.created ──────────────────────────────────────────────
  if (event.type !== "user.created") {
    return NextResponse.json({ received: true });
  }

  const { first_name, email_addresses, primary_email_address_id } = event.data;

  const primaryEmail = email_addresses.find(
    (e) => e.id === primary_email_address_id
  )?.email_address;

  if (!primaryEmail) {
    console.error("[clerk-webhook] No primary email found for user:", event.data.id);
    return NextResponse.json({ error: "No email address" }, { status: 400 });
  }

  const firstName = first_name?.trim() || "there";
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aevaia.com";
  const ctaUrl    = `${appUrl}/dashboard`;

  // ── Send welcome email via Resend ─────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.error("[clerk-webhook] RESEND_API_KEY is not set — skipping email");
    return NextResponse.json({ received: true, warning: "Email not sent — RESEND_API_KEY missing" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from:    "Aevaia <hello@aevaia.com>",
      to:      primaryEmail,
      subject: "Welcome to Aevaia ✦",
      react:   WelcomeEmail({ firstName, ctaUrl }),
    });

    if (error) {
      console.error("[clerk-webhook] Resend error:", error);
      // Return 200 so Clerk does not keep retrying for an email failure
      return NextResponse.json({ received: true, emailError: error.message });
    }

    console.log("[clerk-webhook] Welcome email sent →", primaryEmail, "id:", data?.id);
    return NextResponse.json({ received: true, emailId: data?.id });

  } catch (err) {
    console.error("[clerk-webhook] Unexpected error sending email:", err);
    return NextResponse.json({ received: true, emailError: "unexpected failure" });
  }
}
