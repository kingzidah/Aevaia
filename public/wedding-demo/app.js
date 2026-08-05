// QR generator, served from our own origin. Vendored rather than imported from
// a CDN on purpose: this file is a <script type="module">, so a blocked or slow
// third-party import aborts the WHOLE module and takes the RSVP form down with
// it — the exact failure described below for the old Firebase import.
import qrcode from './vendor/qrcode.mjs';

/* =========================================
   1. ANALYTICS
   ========================================= */
// Previously a Firebase/Firestore client. Removed deliberately — it was never
// live (the config was placeholder "YOUR_API_KEY" values, so every write failed
// silently), and it was loaded via a STATIC ES import from www.gstatic.com.
// Because this file is a <script type="module">, a blocked or failed import
// aborts the entire module — meaning one CDN hiccup, or the site's Content
// Security Policy, would take down every scene transition and the RSVP form
// along with it. RSVP data has always gone to the webhook in section 8 instead.
//
// Kept as a local no-op so the two call sites below stay valid and this stays a
// one-line change if real analytics are ever wired up.
function logEvent(type, data = {}) {
    if (typeof console !== 'undefined' && console.debug) {
        console.debug('[wedding] event:', type, data);
    }
}

/* =========================================
   2. AUDIO & HAPTICS
   ========================================= */
// Audio (background music + a recorded voice note) was removed deliberately.
// The two mp3s it pointed at were never added to the repo, so every guest hit a
// 404 pair on load and the letter scene animated a "now playing" waveform over
// silence. Removed rather than left dangling: the players, the volume fade, and
// the waveform markup/animation are all gone.
//
// To bring it back: add the mp3s under assets/, restore the <audio> elements and
// the .voice-note-container block in index.html, and reinstate the fade + a
// playback-driven waveform toggle here.

function pulsePhone(pattern = [30, 40, 30]) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
}

/* =========================================
   3. LANDING PAGE
   ========================================= */
document.getElementById('btn-yes').addEventListener('click', () => {
    pulsePhone([20]);
    window.nextScene('scene-candle');
});

document.getElementById('btn-no').addEventListener('click', () => {
    pulsePhone([10, 30, 10]);
    document.getElementById('no-message').classList.remove('hidden');
    document.getElementById('btn-yes').style.display = 'none';
    document.getElementById('btn-no').style.display  = 'none';
    setTimeout(() => {
        window.nextScene('scene-candle');
    }, 1800);
});

/* =========================================
   4. INVITATION REVEAL
   ========================================= */
const revealCard = document.getElementById('reveal-card');

function triggerReveal() {
    if (revealCard._revealed) return;
    revealCard._revealed = true;
    pulsePhone([20, 50, 20]);

    revealCard.style.transform = 'scale(0.95)';
    setTimeout(() => {
        revealCard.style.transform = 'scale(1)';
        document.querySelector('.fog-layer').classList.add('cleared');

        try {
            const heartShape = confetti.shapeFromText({ text: '❤', scalar: 2 });
            const petalShape = confetti.shapeFromText({ text: '🌸', scalar: 1.8 });
            confetti({ particleCount: 65, spread: 130, origin: { y: 0.55 }, shapes: [heartShape, petalShape], scalar: 2, ticks: 220, gravity: 0.55 });
        } catch(e) {
            confetti({ particleCount: 65, spread: 130, origin: { y: 0.55 } });
        }

        setTimeout(() => window.nextScene('scene-gallery'), 2200);
    }, 250);
}
revealCard.addEventListener('click', triggerReveal);

/* =========================================
   5. SCENE SWITCHER
   ========================================= */
window.nextScene = function(sceneId) {
    const next = document.getElementById(sceneId);
    if (!next) return;

    document.querySelectorAll('.scene').forEach(s => {
        if (s === next) return;
        s.classList.remove('active');
        setTimeout(() => s.classList.add('hidden'), 1100);
    });

    next.classList.remove('hidden');
    setTimeout(() => next.classList.add('active'), 50);

    if (sceneId === 'scene-letter') {
        setTimeout(window.startTypewriter, 1000);
    }
    if (sceneId === 'scene-finale') {
        window.startCountdown();
        createFinaleParticles();
        animateVenueAddress();
    }
};

/* =========================================
   6. GALLERY & MODAL
   ========================================= */
window.openModal = (src) => {
    document.getElementById('image-modal').classList.remove('hidden');
    document.getElementById('modal-img').src = src;
    document.getElementById('modal-img').alt = 'Opeyemi and Uriel';
    pulsePhone([15]);
};
window.closeModal = () => document.getElementById('image-modal').classList.add('hidden');

/* ----- gallery carousel dots -----
   The swiping itself is pure CSS scroll-snap; this only keeps the dots in sync
   and lets them be tapped. Position is derived from scrollLeft rather than
   tracked in a variable, so a flick that skips a slide still lands on the right
   dot. Throttled with rAF because scroll fires far faster than paint. */
(() => {
    const track = document.getElementById('gallery-carousel');
    const dots  = document.getElementById('gallery-dots');
    if (!track || !dots) return;

    const buttons = [...dots.querySelectorAll('.gallery-dot')];

    const syncDots = () => {
        const slide = track.scrollWidth / buttons.length;
        // The gallery scene starts display:none, so on first run scrollWidth is
        // 0 and this divides by zero — Math.round(NaN) is NaN, every comparison
        // below fails, and NO dot ends up active. Bail until the track has real
        // dimensions; the ResizeObserver re-runs this once the scene is shown.
        if (!slide || !Number.isFinite(slide)) return;
        const index = Math.min(
            buttons.length - 1,
            Math.max(0, Math.round(track.scrollLeft / slide)),
        );
        buttons.forEach((b, i) => b.classList.toggle('is-active', i === index));
    };

    let ticking = false;
    track.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { syncDots(); ticking = false; });
    }, { passive: true });

    // Fires when the scene becomes visible and the track finally has a width.
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(syncDots).observe(track);
    }

    // Jumping to a slide when a dot is tapped.
    //
    // Two things had to be worked around. Computing the destination from
    // offsetLeft is wrong (it is measured from the offset parent, not the scroll
    // container), so the position is taken from getBoundingClientRect deltas
    // instead — always correct regardless of layout. And `scroll-snap-type:
    // mandatory` re-snaps *during* a programmatic smooth scroll, which
    // intermittently dragged the carousel back to the slide it started on; snap
    // is therefore switched off for the duration and restored once settled.
    // Swiping by hand is unaffected either way — that is pure CSS.
    let restoreSnap;
    const scrollToIndex = (i) => {
        const target = track.children[i];
        if (!target) return;
        const tr = track.getBoundingClientRect();
        const cr = target.getBoundingClientRect();
        const delta = (cr.left + cr.width / 2) - (tr.left + tr.width / 2);

        track.style.scrollSnapType = 'none';
        track.scrollBy({ left: delta, behavior: 'smooth' });

        clearTimeout(restoreSnap);
        restoreSnap = setTimeout(() => {
            track.style.scrollSnapType = '';
            syncDots();
        }, 600);
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            scrollToIndex(Number(btn.dataset.index));
            pulsePhone([10]);
        });
    });

    syncDots();
})();

/* =========================================
   7. TYPEWRITER (LETTER)
   ========================================= */
const letterText = `Love has brought us here — and we can't wait to celebrate with you!\n\nWith hearts full of joy and gratitude, we joyfully invite you to witness and celebrate the union of\n\nOpeyemi & Uriel\n\nAs we begin this beautiful new chapter together, your presence would mean the world to us.\n\nDate: Saturday, 28th November 2026\nVenue: Pleasant Event Center, Ikeja\n\nThis day is more than a celebration — it is the beginning of our forever, and we would be honored to share every moment of it with you. Come laugh with us, dance with us, and be part of the memories we will cherish for a lifetime.\n\nDress Code: White & Wine\n\nWith all our love,\nWe can't wait to celebrate with you.`;
let charIndex = 0;

window.startTypewriter = function() {
    const el = document.getElementById('typewriter-text');
    const container = document.querySelector('.typewriter-container');
    if (charIndex < letterText.length) {
        el.innerHTML += letterText.charAt(charIndex) === '\n' ? '<br>' : letterText.charAt(charIndex);
        charIndex++;
        container.scrollTop = container.scrollHeight;
        setTimeout(window.startTypewriter, 32);
    } else {
        el.innerHTML = el.innerHTML.replace('Opeyemi & Uriel', '<span class="heavy-names">Opeyemi & Uriel</span>');
        setTimeout(typeWriterSignature, 600);
    }
};

const signatureText = `– Opeyemi & Uriel`;
let signatureIndex = 0;
function typeWriterSignature() {
    const el = document.getElementById('signed-name');
    el.style.opacity = '1';
    if (signatureIndex < signatureText.length) {
        el.textContent = signatureText.substring(0, signatureIndex + 1);
        signatureIndex++;
        setTimeout(typeWriterSignature, 90);
    }
}

/* =========================================
   8. COUNTDOWN
   ========================================= */
window.startCountdown = function() {
    const weddingDate = new Date("November 28, 2026 00:00:00").getTime();

    const tick = () => {
        const dist = weddingDate - Date.now();
        if (dist <= 0) {
            ['days','hours','mins','secs'].forEach(id => document.getElementById(id).innerText = '00');
            return;
        }
        document.getElementById('days').innerText  = String(Math.floor(dist / 86400000)).padStart(2, '0');
        document.getElementById('hours').innerText = String(Math.floor((dist % 86400000) / 3600000)).padStart(2, '0');
        document.getElementById('mins').innerText  = String(Math.floor((dist % 3600000) / 60000)).padStart(2, '0');
        document.getElementById('secs').innerText  = String(Math.floor((dist % 60000) / 1000)).padStart(2, '0');
    };
    tick();
    setInterval(tick, 1000);
};

/* =========================================
   9. PARTICLES & CURSOR
   ========================================= */
function createFinaleParticles() {
    const scene = document.getElementById('scene-finale');
    const colors = ['var(--rose-soft)', 'var(--wedding-gold)', 'var(--rose-deep)'];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        const size = Math.random() * 18 + 5;
        p.classList.add('finale-particle');
        p.style.width = `${size}px`; p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`; p.style.bottom = '-20px';
        p.style.animationDelay = `${Math.random() * 2.5}s`;
        p.style.animationDuration = `${Math.random() * 3 + 3}s`;
        p.style.background = `radial-gradient(circle, ${colors[i % 3]} 0%, transparent 70%)`;
        scene.appendChild(p);
    }
}

for (let i = 0; i < 18; i++) {
    const ff = document.createElement('div');
    ff.classList.add('firefly');
    const angle = Math.random() * 2 * Math.PI, radius = 30 + Math.random() * 45;
    ff.style.setProperty('--x', `${Math.cos(angle) * radius}vw`);
    ff.style.setProperty('--y', `${Math.sin(angle) * radius}vh`);
    ff.style.animationDelay = `${Math.random() * 15}s`;
    ff.style.animationDuration = `${12 + Math.random() * 8}s`;
    document.body.appendChild(ff);
}

const cursorTrail = document.getElementById('cursor-trail');
document.addEventListener('mousemove', (e) => {
    cursorTrail.style.left = `${e.clientX}px`;
    cursorTrail.style.top = `${e.clientY}px`;
});

/* =========================================
   10. VENUE CONFIGURATION & MAPS
   ========================================= */
const VENUE_NAME    = "Pleasant Event Center";
const VENUE_ADDRESS = "Ikeja";

function animateVenueAddress() {
    document.getElementById('venue-name-text').textContent = VENUE_NAME;
    document.getElementById('venue-address-text').textContent = VENUE_ADDRESS;
}

window.openDirections = function() {
    // Official Google Maps Directions Link
    const encoded = encodeURIComponent(`${VENUE_NAME}, ${VENUE_ADDRESS}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    logEvent('directions_opened', { venue: VENUE_NAME });
};

window.addToCalendar = function() {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: "Opeyemi & Uriel's Wedding",
        dates: '20261128/20261129',
        location: `${VENUE_NAME}, ${VENUE_ADDRESS}`,
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener,noreferrer');
    logEvent('calendar_add', {});
};

/* =========================================
   11. RSVP FORM
   ========================================= */
// Replace with your webhook URL (Google Apps Script, Zapier, Make, Pipedream, etc.)
// If using Google Apps Script, add mode: 'no-cors' to the fetch options below.
const SPREADSHEET_WEBHOOK_URL = "https://hook.eu1.make.com/y38cnhn39qk3yjtva8a2vjmrwbch7qu5";
const rsvpChoiceBtns = document.getElementById('rsvp-choice-btns');
const rsvpYesForm    = document.getElementById('rsvp-yes-form');
const rsvpNoForm     = document.getElementById('rsvp-no-form');
const rsvpThanks     = document.getElementById('rsvp-thanks');

// The "Which side do you belong to?" group picker (Family of the Bride, PTML,
// Rubycom, Parents' Friends, …) was removed at the couple's request — guests now
// just give name, phone, and email.
//
// `group` is still SENT in the webhook payload below, as an empty string. The
// Make.com scenario on the other end maps fields into a spreadsheet by name, so
// dropping the key entirely could shift or break its column mapping. Keeping the
// key with an empty value preserves the payload shape.
const sideValue = '';

// Fills in the entry ticket on the finale scene. Called right after a
// successful RSVP, so the guest can screenshot their pass while they are still
// on the page — the only delivery route that does not depend on an email
// arriving, SMS credit, or a WhatsApp template being approved.
//
// The QR is drawn ON THE DEVICE from a vendored library, not fetched from an
// image service. Two reasons:
//   • The ticket code is a credential — it opens the gate. Putting it in a URL
//     to a third party writes every guest's code into someone else's request
//     logs, for a wedding they were never part of.
//   • It has to work on a bad connection. A remote image is exactly the thing
//     that fails on venue wifi, and it fails at the moment the guest needs it.
// The library is served from our own origin rather than a CDN for the same
// availability reason.
//
// If no code came back (our API was unreachable), the card stays hidden rather
// than showing a broken QR: the guest is still recorded in the spreadsheet, and
// the gate falls back to the printed list.
function showTicket(code) {
    if (!code) return;
    const card = document.getElementById('ticket-card');
    const img  = document.getElementById('ticket-qr');
    const text = document.getElementById('ticket-code-text');
    if (!card || !img || !text) return;

    // The code in text is filled in FIRST and never depends on the QR: if
    // drawing fails for any reason, the guest still has something to read out
    // at the gate, and the gate can type it in.
    text.textContent = code;
    card.classList.remove('hidden');

    try {
        // typeNumber 0 = auto-size to the data. 'M' correction tolerates a
        // scuffed or half-lit phone screen without inflating the image.
        const qr = qrcode(0, 'M');
        qr.addData(code);
        qr.make();
        // 6px cells with a 2-cell quiet zone: comfortably scannable from a
        // phone held at arm's length, still small enough to screenshot whole.
        img.src = qr.createDataURL(6, 2);
    } catch (err) {
        console.warn('[ticket] QR render failed, code shown as text:', err);
        img.style.display = 'none';
    }
}

function hideChoiceBtns(cb) {
    rsvpChoiceBtns.style.opacity = '0';
    rsvpChoiceBtns.style.transform = 'scale(0.95)';
    setTimeout(() => { rsvpChoiceBtns.style.display = 'none'; cb(); }, 420);
}

document.getElementById('rsvp-yes-btn').addEventListener('click', () => {
    pulsePhone([20]);
    hideChoiceBtns(() => requestAnimationFrame(() => rsvpYesForm.classList.add('visible')));
});

document.getElementById('rsvp-no-btn').addEventListener('click', () => {
    pulsePhone([10, 30, 10]);
    hideChoiceBtns(() => requestAnimationFrame(() => rsvpNoForm.classList.add('visible')));
});

/* ----- Notification helpers (called in background after submit) ----- */

function notifyCouple(guestData) {
    const payload = {
        subject: 'New RSVP Received! 💍',
        body: [
            'New RSVP Received!',
            `Name:  ${guestData.name}`,
            `Group: ${guestData.group}`,
            `Phone: ${guestData.phone}`,
            `Email: ${guestData.email || 'None provided'}`,
        ].join('\n'),
    };
    // TODO: Insert API integration here (EmailJS / Firebase Trigger Email → couple's address)
    console.log('[notifyCouple]', payload);
}

function sendGuestSMS(guestData) {
    const message = `Thank you for RSVPing, ${guestData.name}! We are so thrilled you will be joining us on Nov 28th to celebrate our love. - Opeyemi & Uriel`;
    // TODO: Insert API integration here (Twilio / Termii / Africa's Talking)
    console.log('[sendGuestSMS →', guestData.phone, ']', message);
}

function sendGuestEmail(guestData) {
    const calendarParams = new URLSearchParams({
        action: 'TEMPLATE',
        text: "Opeyemi & Uriel's Wedding",
        dates: '20261128/20261129',
        location: `${VENUE_NAME}, ${VENUE_ADDRESS}`,
    });
    const calendarLink = `https://calendar.google.com/calendar/render?${calendarParams}`;

    const payload = {
        to:      guestData.email,
        subject: "You're going to a wedding! 💍 — Opeyemi & Uriel",
        body: [
            `Dear ${guestData.name},`,
            '',
            'Thank you so much for confirming your attendance! We are overflowing with joy and cannot wait to celebrate our special day with you.',
            '',
            'Date:       Saturday, 28th November 2026',
            `Venue:      ${VENUE_NAME}, ${VENUE_ADDRESS}`,
            'Dress Code: White & Wine',
            '',
            'Click here to add this to your calendar:',
            calendarLink,
            '',
            'With love,',
            'Opeyemi & Uriel 💍',
        ].join('\n'),
    };
    // TODO: Insert API integration here (EmailJS / Firebase Trigger Email → guest's address)
    console.log('[sendGuestEmail →', guestData.email, ']', payload.subject);
}

/* ----- Submit handler ----- */

document.getElementById('rsvp-submit-yes').addEventListener('click', async () => {
    const nameEl    = document.getElementById('rsvp-name');
    const phoneEl   = document.getElementById('rsvp-phone');
    const emailEl   = document.getElementById('rsvp-email');
    const btn       = document.getElementById('rsvp-submit-yes');
    const phoneErr  = document.getElementById('phone-error');
    const submitErr = document.getElementById('rsvp-submit-error');

    // ── Reset validation state ────────────────────────────────────────────────
    nameEl.classList.remove('invalid');
    phoneEl.classList.remove('invalid');
    emailEl.classList.remove('invalid');
    phoneErr.classList.add('hidden');
    submitErr.classList.add('hidden');

    // ── Validate fields ───────────────────────────────────────────────────────
    let valid = true;

    if (!nameEl.value.trim()) { nameEl.classList.add('invalid'); valid = false; }

    if (window._iti) {
        if (!window._iti.isValidNumber()) {
            phoneEl.classList.add('invalid');
            phoneErr.classList.remove('hidden');
            valid = false;
        }
    } else if (!phoneEl.value.trim()) {
        phoneEl.classList.add('invalid');
        valid = false;
    }

    const emailVal = emailEl.value.trim();
    if (emailVal && !emailVal.includes('@')) { emailEl.classList.add('invalid'); valid = false; }

    if (!valid) { pulsePhone([80, 50, 80]); return; }

    // ── Collect payload ───────────────────────────────────────────────────────
    // inviteLink — custom domain dropped into the Make.com confirmation email
    const guestData = {
        name:       nameEl.value.trim(),
        phone:      window._iti ? window._iti.getNumber() : phoneEl.value.trim(),
        email:      emailVal,
        group:      sideValue,
        timestamp:  new Date().toISOString(),
        inviteLink: 'https://opeyemianduriel.aevaia.com',
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    btn.disabled    = true;
    btn.textContent = 'Confirming...';
    pulsePhone([20, 50, 20]);

    // ── Register the guest and mint their ticket code ─────────────────────────
    // Runs BEFORE the Make.com call so the ticket code can be included in that
    // payload — Make embeds it in the QR on the emailed entry ticket, and the
    // gate scanner resolves that code back to this guest.
    //
    // Same-origin: the proxy deliberately does not rewrite /api/* on this host.
    //
    // A failure here must NOT block the RSVP. The couple would rather have a
    // guest recorded in the spreadsheet with no scannable ticket (the gate can
    // fall back to the printed list) than lose the RSVP entirely.
    let ticketCode = '';
    try {
        const ticketRes = await fetch('/api/wedding/rsvp', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name:  guestData.name,
                phone: guestData.phone,
                email: guestData.email,
            }),
        });
        if (ticketRes.ok) {
            const ticketJson = await ticketRes.json();
            ticketCode = ticketJson.ticket_code || '';
        } else {
            console.warn('[rsvp] ticket registration failed:', ticketRes.status);
        }
    } catch (err) {
        console.warn('[rsvp] ticket registration unavailable:', err);
    }

    guestData.ticketCode = ticketCode;

    // ── POST to spreadsheet webhook ───────────────────────────────────────────
    try {
        await fetch(SPREADSHEET_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(guestData),
        });

        // If we reach here the request was delivered — treat as confirmed
        btn.textContent = 'Confirmed! ✓';
        try { confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } }); } catch(e){}
        showTicket(ticketCode);
        setTimeout(() => window.nextScene('scene-finale'), 1500);

    } catch (err) {
        console.error('Webhook Error:', err);
        // Only a real network failure (offline, DNS, etc.) reaches here
        btn.disabled    = false;
        btn.textContent = 'Confirm Attendance 💍';
        submitErr.classList.remove('hidden');
        pulsePhone([80, 50, 80]);
    }
});

document.getElementById('rsvp-submit-no').addEventListener('click', () => {
    pulsePhone([10, 40, 10]);
    rsvpNoForm.classList.remove('visible');
    document.getElementById('rsvp-thanks-text').textContent = "Your love and warm wishes mean the world to us. 💌";
    requestAnimationFrame(() => rsvpThanks.classList.add('visible'));
});