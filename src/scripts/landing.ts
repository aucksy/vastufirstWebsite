import { zones } from '../data/zones';

/**
 * The landing page's motion.
 *
 * One scroll handler, rAF-throttled, passive, doing DOM writes only — no
 * framework state in the loop, so it holds 60fps. Everything that can be a CSS
 * media query is one (see global.css); only the two things that genuinely need
 * innerHeight arithmetic live here: the phone fit, and scroll progress.
 */

const $ = (id: string) => document.getElementById(id);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COMPASS_16 = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

/* -------------------------------------------------------------------------
   Phone fit
   `transform: scale()` shrinks the phone visually but not its layout box, so
   the negative margin is not optional — without it the row stays 660px tall
   and the released-pin section clips anyway.
   ------------------------------------------------------------------------- */
function fitPhone() {
  const ph = $('vfHowPhone');
  if (!ph) return;
  const narrow = window.innerWidth <= 900;
  const unpinned = narrow || window.innerHeight <= 800;
  // The handoff's 0.66, kept. Its original reason is gone — nothing is pinned
  // on a narrow screen any more, so there is no step card to leave room under
  // (see global.css) — but 0.66 is still the right number: it is the largest
  // scale at which the whole device and the step card above it fit on a 740px
  // screen at once. Photographed at 0.80 the device ran to 71% of that screen.
  const cap = narrow ? 0.66 : 0.86;
  const s = unpinned
    ? Math.max(0.52, Math.min(cap, (window.innerHeight - 170) / 680))
    : Math.min(1, (window.innerHeight - 150) / 680);
  ph.style.transformOrigin = 'top center';
  ph.style.transform = `scale(${s.toFixed(3)})`;
  ph.style.marginBottom = `${(-(1 - s) * 660).toFixed(0)}px`;
}

/* -------------------------------------------------------------------------
   Reveal on scroll
   ------------------------------------------------------------------------- */
function initReveals() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const d = Number((e.target as HTMLElement).dataset.reveal || 0);
        window.setTimeout(() => e.target.classList.add('is-in'), d * 110);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15 },
  );
  targets.forEach((el) => io.observe(el));
}

/* -------------------------------------------------------------------------
   Nav jumps
   ------------------------------------------------------------------------- */
function initJumps() {
  document.querySelectorAll<HTMLAnchorElement>('[data-jump]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = $(a.dataset.jump!);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 60,
        behavior: reduce ? 'auto' : 'smooth',
      });
    });
  });
}

/* -------------------------------------------------------------------------
   Waitlist form
   ------------------------------------------------------------------------- */
function initForm() {
  const form = $('vfForm') as HTMLFormElement | null;
  const input = $('vfEmail') as HTMLInputElement | null;
  const btn = $('vfSubmit') as HTMLButtonElement | null;
  const msg = $('vfFormMsg');
  const ok = $('vfSuccess');
  if (!form || !input || !btn || !msg || !ok) return;

  let flashTimer: number | undefined;
  const flashError = (text: string) => {
    msg.textContent = text;
    input.classList.add('is-error');
    input.focus();
    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => input.classList.remove('is-error'), 1200);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    // Deliberately loose: the server validates properly. This only catches the
    // empty box and the obvious typo, which is what the flash is for.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      flashError('That does not look like an email address.');
      return;
    }

    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Adding…';
    msg.textContent = '';

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 400) {
        // The server rejected the address itself. "Try again in a moment" would
        // send them round the same loop forever.
        btn.disabled = false;
        btn.textContent = label;
        flashError('That does not look like an email address.');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      form.hidden = true;
      ok.hidden = false;
      msg.textContent = '';
      (ok as HTMLElement).setAttribute('tabindex', '-1');
      (ok as HTMLElement).focus();
    } catch {
      // Never pretend. If it did not save, say so and leave the address in place.
      btn.disabled = false;
      btn.textContent = label;
      flashError('We could not save that just now. Please try again in a moment.');
    }
  });
}

/* -------------------------------------------------------------------------
   The scroll loop
   ------------------------------------------------------------------------- */
function initScroll() {
  const doc = document.documentElement;
  const zoneCount = zones.length; // 9 — the eight wedges plus the centre
  const wedgeCount = zoneCount - 1;

  let ticking = false;
  let zIdx = -1;

  const progressOf = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    if (span <= 0) return r.top <= 0 ? 1 : 0;
    return clamp01(-r.top / span);
  };

  const update = () => {
    ticking = false;
    const y = window.scrollY;

    // Progress hairline
    const pb = $('vfProgress');
    if (pb) {
      const pct = clamp01(y / (doc.scrollHeight - window.innerHeight)) * 100;
      pb.style.width = `${pct.toFixed(2)}%`;
    }

    // Parallax + rotations + the live degree readout
    if (!reduce) {
      const hd = $('vfHeroDial');
      if (hd) hd.style.transform = `rotate(${y * 0.06}deg)`;
      const hg = $('vfHeroGrid');
      if (hg) hg.style.transform = `translateY(${y * 0.12}px)`;
      const pd = $('vfPhoneDial');
      if (pd) pd.setAttribute('transform', `rotate(${-y * 0.12})`);
      const cd = $('vfCtaDial');
      if (cd) cd.style.transform = `rotate(${y * 0.03}deg)`;

      const deg = (((y * 0.12) % 360) + 360) % 360;
      const dg = $('vfDeg');
      if (dg) dg.textContent = `${Math.round(deg)}°`;
      const dr = $('vfDir');
      if (dr) dr.textContent = COMPASS_16[Math.round(deg / 22.5) % 16];
    }

    // How it works — three screens crossfading
    const how = $('vfHowWrap');
    if (how) {
      const p = progressOf(how);
      const i = Math.min(2, Math.floor(p * 3));
      for (let k = 0; k < 3; k++) {
        const scr = $(`vfScr${k}`);
        if (scr) {
          const on = k === i;
          scr.style.opacity = on ? '1' : '0';
          scr.style.transform = on ? 'translateY(0)' : k < i ? 'translateY(-18px)' : 'translateY(18px)';
          scr.style.pointerEvents = on ? 'auto' : 'none';
          scr.setAttribute('aria-hidden', on ? 'false' : 'true');
        }
        const st = $(`vfStep${k}`);
        if (st) st.classList.toggle('is-active', k === i);
        const dot = $(`vfDot${k}`);
        if (dot) dot.classList.toggle('is-active', k === i);
      }
    }

    // The nine zones — the wheel turns, the panel swaps
    const zw = $('vfZoneWrap');
    if (zw) {
      const p = progressOf(zw);
      const wheel = $('vfWheel');
      if (wheel && !reduce) {
        // 315° is seven 45° steps: the eighth wedge reaches the pointer at the
        // eighth stop, then the wheel holds while the centre has its turn.
        const turn = Math.min(1, (p * zoneCount) / wedgeCount) * 315;
        wheel.setAttribute('transform', `rotate(${-turn})`);
      }
      const i = Math.min(zoneCount - 1, Math.floor(p * zoneCount));
      if (i !== zIdx) {
        zIdx = i;
        const z = zones[i];
        const set = (id: string, v: string) => {
          const el = $(id);
          if (el) el.textContent = v;
        };
        set('vfZName', z.name);
        set('vfZDeva', z.deva);
        set('vfZElem', z.attribution);
        set('vfZDeg', z.measure);
        set('vfZDesc', z.desc);
        set('vfZIdx', String(i + 1).padStart(2, '0'));

        const onCentre = i === wedgeCount;
        for (let k = 0; k < wedgeCount; k++) {
          const w = $(`vfW${k}`);
          if (w) w.setAttribute('fill', k === i ? '#7A9E7E' : '#2C352B');
        }
        const c = $('vfCentre');
        if (c) {
          c.setAttribute('fill', onCentre ? '#7A9E7E' : '#232A22');
          c.setAttribute('stroke', onCentre ? '#7A9E7E' : '#3B4433');
        }
        const t1 = $('vfCentreT1');
        if (t1) t1.setAttribute('fill', onCentre ? '#232A22' : '#98A08C');
        const t2 = $('vfCentreT2');
        if (t2) t2.setAttribute('fill', onCentre ? '#2C352B' : '#6B7064');
      }
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ------------------------------------------------------------------------- */
function boot() {
  fitPhone();
  window.addEventListener('resize', fitPhone, { passive: true });
  initReveals();
  initJumps();
  initForm();
  initScroll();
  // Fonts land after first paint and change the phone's content height.
  if ('fonts' in document) {
    (document as Document & { fonts: FontFaceSet }).fonts.ready.then(fitPhone);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
