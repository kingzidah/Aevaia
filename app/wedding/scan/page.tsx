"use client";

// Gate scanner for the Opeyemi & Uriel wedding.
//
// Built for one job, done standing up, one-handed, on a phone, in the dark,
// with a queue behind you: point at a guest's ticket QR, get a big green or red
// answer. Everything here is in service of that.
//
// Deliberate choices:
//  - jsQR is bundled, not loaded from a CDN, so the app's strict CSP is untouched.
//  - The gate PIN is entered once and kept in sessionStorage, so a dropped
//    connection or accidental refresh does not lock a bouncer out mid-queue.
//  - The camera stream is torn down on unmount; leaving it live drains a phone
//    battery over a long evening.
//  - Requires HTTPS (or localhost) — getUserMedia is unavailable otherwise.
//    Note next.config.ts sets Permissions-Policy camera=(self); with the
//    default camera=() this page cannot open the camera at all.

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Outcome =
  | { status: "ok"; name: string; code: string }
  | { status: "already"; name: string; code: string; checked_in_at?: string }
  | { status: "notfound"; code: string }
  | { status: "invalid" }
  | { status: "error"; message: string };

const PIN_KEY = "wedding-gate-pin";

export default function GateScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // Guards against re-submitting while a scan is in flight, and against the
  // same code firing on every animation frame while the QR stays in view.
  const busyRef = useRef(false);
  const lastCodeRef = useRef<string>("");

  const [pin, setPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(PIN_KEY);
    if (stored) {
      setPin(stored);
      setPinSaved(true);
    }
  }, []);

  const submitCode = useCallback(
    async (scanned: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch("/api/wedding/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanned, pin }),
        });
        const data = await res.json();

        if (res.status === 401) {
          setOutcome({ status: "error", message: "Wrong gate PIN" });
          sessionStorage.removeItem(PIN_KEY);
          setPinSaved(false);
        } else if (!res.ok) {
          setOutcome({ status: "error", message: data?.error ?? "Something went wrong" });
        } else {
          setOutcome(data as Outcome);
          if (navigator.vibrate) {
            navigator.vibrate(data.status === "ok" ? [40] : [80, 60, 80]);
          }
        }
      } catch {
        setOutcome({ status: "error", message: "No connection. Check the venue wifi." });
      } finally {
        // Brief cooldown so the same ticket in view does not re-fire instantly.
        setTimeout(() => {
          busyRef.current = false;
        }, 1200);
      }
    },
    [pin],
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(image.data, image.width, image.height, {
          inversionAttempts: "dontInvert",
        });

        if (result?.data && result.data !== lastCodeRef.current) {
          lastCodeRef.current = result.data;
          void submitCode(result.data);
          // Allow the same ticket to be re-scanned after the cooldown.
          setTimeout(() => {
            lastCodeRef.current = "";
          }, 2500);
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [submitCode]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // facingMode "environment" = rear camera, which is the one pointed at a
        // guest's phone. Without it, phones default to the selfie camera.
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access for this site in your browser settings, then reload."
          : name === "NotFoundError"
            ? "No camera found on this device."
            : "Could not start the camera. Make sure this page is open over HTTPS.",
      );
    }
  }, [tick]);

  // Always release the camera when leaving the page.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function savePin(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    sessionStorage.setItem(PIN_KEY, pin.trim());
    setPinSaved(true);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    void submitCode(manualCode.trim());
    setManualCode("");
  }

  // ── PIN gate ────────────────────────────────────────────────────────────────
  if (!pinSaved) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <h1 style={S.h1}>Gate Check-In</h1>
          <p style={S.sub}>Opeyemi &amp; Uriel · 28 Nov 2026</p>
          <form onSubmit={savePin}>
            <label style={S.label} htmlFor="pin">
              Enter the gate PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={S.input}
              autoFocus
            />
            <button type="submit" style={S.primaryBtn}>
              Start
            </button>
          </form>
          {outcome?.status === "error" && <p style={S.errorText}>{outcome.message}</p>}
        </div>
      </main>
    );
  }

  // ── Scanner ─────────────────────────────────────────────────────────────────
  const banner = outcomeBanner(outcome);

  return (
    <main style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>Gate Check-In</h1>

        {banner && (
          <div style={{ ...S.banner, background: banner.bg, color: banner.fg }}>
            <div style={S.bannerIcon}>{banner.icon}</div>
            <div>
              <div style={S.bannerTitle}>{banner.title}</div>
              {banner.detail && <div style={S.bannerDetail}>{banner.detail}</div>}
            </div>
          </div>
        )}

        <div style={S.videoWrap}>
          <video ref={videoRef} style={S.video} muted playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {!scanning && <div style={S.videoIdle}>Camera off</div>}
        </div>

        {!scanning ? (
          <button onClick={startCamera} style={S.primaryBtn}>
            Start camera
          </button>
        ) : (
          <p style={S.hint}>Point at the QR code on the guest&apos;s ticket.</p>
        )}

        {cameraError && <p style={S.errorText}>{cameraError}</p>}

        <form onSubmit={submitManual} style={S.manualRow}>
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Or type the code, e.g. OU-2K6T5N"
            style={{ ...S.input, marginBottom: 0 }}
            autoCapitalize="characters"
          />
          <button type="submit" style={S.secondaryBtn}>
            Check
          </button>
        </form>
      </div>
    </main>
  );
}

function outcomeBanner(outcome: Outcome | null) {
  if (!outcome) return null;
  switch (outcome.status) {
    case "ok":
      return {
        bg: "#0f7a3d",
        fg: "#fff",
        icon: "✓",
        title: outcome.name,
        detail: "Let them in",
      };
    case "already":
      return {
        bg: "#b06f00",
        fg: "#fff",
        icon: "!",
        title: `${outcome.name} — already scanned`,
        detail: outcome.checked_in_at
          ? `First entry ${new Date(outcome.checked_in_at).toLocaleTimeString()}`
          : "This ticket has been used",
      };
    case "notfound":
      // Say what to do, not just what went wrong. A bouncer holding up a queue
      // needs the next action, and a real guest can be missing from the list for
      // innocent reasons — an RSVP that never went through, a forwarded ticket.
      return {
        bg: "#a11",
        fg: "#fff",
        icon: "✕",
        title: "Not on the guest list",
        detail: `${outcome.code} — check the printed list before turning anyone away`,
      };
    case "invalid":
      return { bg: "#a11", fg: "#fff", icon: "✕", title: "Not a wedding ticket", detail: "Wrong QR code" };
    case "error":
      return { bg: "#444", fg: "#fff", icon: "…", title: outcome.message, detail: "" };
  }
}

// Inline styles: this page is intentionally self-contained and independent of
// the studio's design system, so it cannot be broken by unrelated CSS changes.
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "#12070a",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 16,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: { width: "100%", maxWidth: 480 },
  h1: { color: "#fff", fontSize: "1.5rem", margin: "8px 0 2px", textAlign: "center" },
  sub: { color: "#c8a0a8", fontSize: "0.9rem", margin: "0 0 20px", textAlign: "center" },
  label: { display: "block", color: "#e8d8dc", marginBottom: 8, fontSize: "0.95rem" },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "1.1rem",
    borderRadius: 12,
    border: "1px solid #5a1a20",
    background: "#1e0d12",
    color: "#fff",
    marginBottom: 12,
    boxSizing: "border-box",
  },
  primaryBtn: {
    width: "100%",
    padding: "16px",
    fontSize: "1.1rem",
    fontWeight: 700,
    borderRadius: 12,
    border: "none",
    background: "#8c2233",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "14px 18px",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: 12,
    border: "1px solid #5a1a20",
    background: "transparent",
    color: "#e8d8dc",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  videoWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    background: "#000",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  videoIdle: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b4a52",
  },
  hint: { color: "#c8a0a8", fontSize: "0.9rem", textAlign: "center", margin: "0 0 12px" },
  errorText: { color: "#ff9aa5", fontSize: "0.9rem", marginTop: 12 },
  banner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 16px",
    borderRadius: 16,
    marginBottom: 12,
  },
  bannerIcon: { fontSize: "2rem", fontWeight: 700, lineHeight: 1 },
  bannerTitle: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.2 },
  bannerDetail: { fontSize: "0.9rem", opacity: 0.9, marginTop: 2 },
};
