/* =========================================
   1. FIREBASE SETUP
   ========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_APP_ID"
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase unavailable — running offline.");
}

async function logEvent(type, data = {}) {
    if (!db) return;
    try {
        await addDoc(collection(db, "wedding_interactions"), { type, data, timestamp: new Date() });
    } catch (e) {}
}

/* =========================================
   2. AUDIO & HAPTICS
   ========================================= */
const bgMusic    = document.getElementById('bg-music');
const voiceNote  = document.getElementById('voice-note');
const waveformBars = document.querySelectorAll('.waveform-bar');

function fadeMusic(targetVolume) {
    const step = 0.02;
    if (bgMusic.fadeInterval) clearInterval(bgMusic.fadeInterval);
    bgMusic.fadeInterval = setInterval(() => {
        const current = bgMusic.volume;
        if (Math.abs(current - targetVolume) < step) {
            bgMusic.volume = targetVolume;
            clearInterval(bgMusic.fadeInterval);
            return;
        }
        bgMusic.volume = current > targetVolume ? Math.max(0, current - step) : Math.min(1, current + step);
    }, 50);
}

function pulsePhone(pattern = [30, 40, 30]) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
}

/* =========================================
   3. LANDING PAGE
   ========================================= */
document.getElementById('btn-yes').addEventListener('click', () => {
    pulsePhone([20]);
    bgMusic.volume = 0.5;
    bgMusic.play().catch(() => {});
    window.nextScene('scene-candle');
});

document.getElementById('btn-no').addEventListener('click', () => {
    pulsePhone([10, 30, 10]);
    document.getElementById('no-message').classList.remove('hidden');
    document.getElementById('btn-yes').style.display = 'none';
    document.getElementById('btn-no').style.display  = 'none';
    setTimeout(() => {
        bgMusic.volume = 0.5;
        bgMusic.play().catch(() => {});
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
        fadeMusic(0.1);
        voiceNote.currentTime = 0;
        voiceNote.play().catch(() => {});
        waveformBars.forEach(b => b.classList.add('playing'));
        setTimeout(window.startTypewriter, 1000);
    }
    if (sceneId === 'scene-rsvp') {
        voiceNote.pause();
        waveformBars.forEach(b => b.classList.remove('playing'));
        fadeMusic(0.5);
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

/* ----- custom group picker ----- */
const sideTrigger = document.getElementById('rsvp-side-trigger');
const sideDisplay = document.getElementById('rsvp-side-display');
const sideMenu    = document.getElementById('rsvp-side-menu');
let   sideValue   = '';

sideTrigger.addEventListener('click', () => {
    const isOpen = sideTrigger.classList.toggle('open');
    sideMenu.classList.toggle('open', isOpen);
    sideTrigger.setAttribute('aria-expanded', String(isOpen));
});

sideMenu.querySelectorAll('.custom-select-item').forEach(item => {
    item.addEventListener('click', () => {
        sideValue = item.dataset.value;
        sideDisplay.textContent = item.textContent.trim();
        sideDisplay.classList.remove('placeholder');
        sideMenu.querySelectorAll('.custom-select-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        sideTrigger.classList.remove('open', 'invalid');
        sideMenu.classList.remove('open');
        sideTrigger.setAttribute('aria-expanded', 'false');
    });
});

document.addEventListener('click', e => {
    if (!document.getElementById('rsvp-side-wrapper').contains(e.target)) {
        sideTrigger.classList.remove('open');
        sideMenu.classList.remove('open');
        sideTrigger.setAttribute('aria-expanded', 'false');
    }
});

sideTrigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sideTrigger.click(); }
    if (e.key === 'Escape') { sideTrigger.classList.remove('open'); sideMenu.classList.remove('open'); }
});

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
    sideTrigger.classList.remove('invalid');
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
    if (!sideValue) { sideTrigger.classList.add('invalid'); valid = false; }

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