import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  firstName: string;
  ctaUrl:    string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aevaia.com";

export function WelcomeEmail({ firstName, ctaUrl }: WelcomeEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to Aevaia — your magic design partner is ready ✦</Preview>

      <Body style={body}>
        <Container style={container}>

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Section style={logoSection}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td align="center">
                  <table cellPadding="0" cellSpacing="0">
                    <tr>
                      <td style={logoIconWrap}>
                        <span style={logoIconText}>♥</span>
                      </td>
                      <td style={{ paddingLeft: "10px", verticalAlign: "middle" }}>
                        <span style={logoWordmark}>Aevaia</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </Section>

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <Section style={heroSection}>
            <Heading style={heading}>Welcome to Aevaia ✦</Heading>
            <Text style={subheading}>Your magic design partner is ready.</Text>
          </Section>

          {/* ── Body ─────────────────────────────────────────────────── */}
          <Section style={bodySection}>
            <Text style={greeting}>Hi {firstName},</Text>

            <Text style={paragraph}>
              Thank you for joining our private alpha. Aevaia is designed to be
              your magic design partner — the fastest way to craft meaningful,
              beautiful digital gift experiences that feel genuinely personal.
            </Text>

            <Text style={paragraph}>
              I noticed you just set up your profile, and I wanted to check in
              personally to make sure you have everything you need. Inside the
              studio you&apos;ll find an infinite canvas, an AI that understands
              your creative intent, and a suite of premium blocks — from ambient
              audio and particle effects to live countdowns and gallery mosaics.
            </Text>

            <Text style={paragraph}>
              The best place to start is the{" "}
              <strong>Create Fresh Canvas Blueprint</strong> button on your
              dashboard. From there, just describe what you want to build and
              let the AI guide the rest.
            </Text>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <Section style={ctaSection}>
              <Button style={ctaButton} href={ctaUrl}>
                Launch Studio Now →
              </Button>
            </Section>

            <Hr style={divider} />

            {/* ── Sign-off ───────────────────────────────────────────── */}
            <Text style={paragraph}>
              If you have any feedback or find anything complicated, just hit
              reply directly to this email — I read every message personally.
            </Text>

            <Text style={signoff}>
              Cheers,
              <br />
              <strong>The Aevaia Team</strong>
            </Text>
          </Section>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <Section style={footer}>
            <Text style={footerText}>
              Aevaia · Digital Gift Experiences
            </Text>
            <Text style={footerText}>
              <Link href={`${BASE_URL}/dashboard`} style={footerLink}>Dashboard</Link>
              {" · "}
              <Link href={`${BASE_URL}/settings`} style={footerLink}>Settings</Link>
              {" · "}
              <Link href={`mailto:hello@aevaia.com`} style={footerLink}>Contact</Link>
            </Text>
            <Text style={footerMuted}>
              You received this because you created an Aevaia account.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  firstName: "Alex",
  ctaUrl:    "https://www.aevaia.com/dashboard",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin:          0,
  padding:         "32px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius:    "16px",
  margin:          "0 auto",
  maxWidth:        "560px",
  overflow:        "hidden",
  boxShadow:       "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.05)",
};

const logoSection: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  padding:         "28px 40px",
};

const logoIconWrap: React.CSSProperties = {
  backgroundColor: "#7c3aed",
  borderRadius:    "10px",
  width:           "32px",
  height:          "32px",
  textAlign:       "center",
  verticalAlign:   "middle",
  lineHeight:      "32px",
};

const logoIconText: React.CSSProperties = {
  color:     "#ffffff",
  fontSize:  "16px",
  lineHeight: "32px",
};

const logoWordmark: React.CSSProperties = {
  color:       "#ffffff",
  fontSize:    "17px",
  fontWeight:  "700",
  letterSpacing: "-0.3px",
};

const heroSection: React.CSSProperties = {
  background:  "linear-gradient(135deg, #1e1333 0%, #0f172a 100%)",
  padding:     "48px 40px 40px",
  textAlign:   "center",
};

const heading: React.CSSProperties = {
  color:        "#ffffff",
  fontSize:     "28px",
  fontWeight:   "800",
  letterSpacing: "-0.5px",
  lineHeight:   "1.2",
  margin:       "0 0 10px",
};

const subheading: React.CSSProperties = {
  color:      "rgba(255,255,255,0.55)",
  fontSize:   "14px",
  margin:     "0",
};

const bodySection: React.CSSProperties = {
  padding: "36px 40px 28px",
};

const greeting: React.CSSProperties = {
  color:      "#111111",
  fontSize:   "16px",
  fontWeight: "600",
  margin:     "0 0 20px",
};

const paragraph: React.CSSProperties = {
  color:        "#444444",
  fontSize:     "15px",
  lineHeight:   "1.7",
  margin:       "0 0 18px",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center",
  margin:    "32px 0",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#7c3aed",
  borderRadius:    "12px",
  color:           "#ffffff",
  display:         "inline-block",
  fontSize:        "14px",
  fontWeight:      "700",
  letterSpacing:   "0.2px",
  padding:         "14px 32px",
  textDecoration:  "none",
};

const divider: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin:      "28px 0",
};

const signoff: React.CSSProperties = {
  color:      "#111111",
  fontSize:   "15px",
  lineHeight: "1.7",
  margin:     "0",
};

const footer: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderTop:       "1px solid #e4e4e7",
  padding:         "24px 40px",
  textAlign:       "center",
};

const footerText: React.CSSProperties = {
  color:     "#888888",
  fontSize:  "12px",
  margin:    "0 0 6px",
};

const footerLink: React.CSSProperties = {
  color:          "#7c3aed",
  textDecoration: "none",
};

const footerMuted: React.CSSProperties = {
  color:     "#aaaaaa",
  fontSize:  "11px",
  margin:    "12px 0 0",
};
