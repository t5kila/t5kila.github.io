(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Year ───────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── Escape helper (defensive, we use textContent elsewhere) ─
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  // ─── Icon SVGs ──────────────────────────────────────
  const icons = {
    instagram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 4L3 11l6 2 2 6 3-5 5 3z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12a8 8 0 1 1-11.6-7.1L3 21l6.2-5.4A8 8 0 0 1 20 12z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
  };

  // ─── Fetch profile & links ──────────────────────────
  async function loadProfile() {
    try {
      const res = await fetch('/api/profile', { credentials: 'same-origin' });
      if (!res.ok) return;
      const { profile, settings } = await res.json();
      if (profile) {
        if (profile.display_name) {
          document.title = `${profile.display_name} — Premium Digital Identity`;
          const bn = document.getElementById('brand-name');
          if (bn) bn.textContent = profile.display_name;
          const ht = document.getElementById('hero-title');
          if (ht) ht.textContent = profile.display_name;
        }
        const tag = document.getElementById('hero-tagline');
        if (tag && profile.tagline) tag.textContent = profile.tagline;
        const bio = document.getElementById('hero-bio');
        if (bio && profile.bio) bio.textContent = profile.bio;
      }
      if (settings && settings.contact_enabled === false) {
        const form = document.getElementById('contact-form');
        if (form) form.style.display = 'none';
      }
    } catch { /* silent */ }
  }

  function hostOf(url) {
    try { return new URL(url).host; } catch { return url; }
  }

  async function loadLinks() {
    const container = document.getElementById('cards');
    if (!container) return;
    try {
      const res = await fetch('/api/links', { credentials: 'same-origin' });
      if (!res.ok) return;
      const { links } = await res.json();
      container.innerHTML = '';
      if (!links || links.length === 0) {
        const p = document.createElement('p');
        p.style.color = 'var(--muted)';
        p.textContent = 'No links available.';
        container.appendChild(p);
        return;
      }
      for (const link of links) {
        const a = document.createElement('a');
        a.className = 'card';
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('role', 'listitem');
        a.setAttribute('aria-label', `${link.label} — ${hostOf(link.url)}`);

        const ic = document.createElement('span');
        ic.className = 'icon';
        ic.innerHTML = icons[link.icon] || icons.link;

        const meta = document.createElement('span');
        meta.className = 'meta';
        const lab = document.createElement('span');
        lab.className = 'label';
        lab.textContent = link.label;
        const host = document.createElement('span');
        host.className = 'host';
        host.textContent = hostOf(link.url);
        meta.append(lab, host);

        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = '→';

        a.append(ic, meta, arrow);

        // Pointer-tracked highlight
        if (!reduceMotion) {
          a.addEventListener('pointermove', (e) => {
            const r = a.getBoundingClientRect();
            a.style.setProperty('--mx', `${e.clientX - r.left}px`);
            a.style.setProperty('--my', `${e.clientY - r.top}px`);
          });
        }

        container.appendChild(a);
      }
    } catch { /* silent */ }
  }

  // ─── Contact form ───────────────────────────────────
  function bindForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    const btn = document.getElementById('send-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = '';
      status.textContent = '';

      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim(),
        company: form.company.value
      };

      // Client-side sanity (server re-validates)
      if (data.name.length < 2 || data.email.length < 3 || data.message.length < 10) {
        status.className = 'err';
        status.textContent = 'Please fill all fields correctly.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(data)
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          status.className = 'err';
          status.textContent = body.error || 'Failed to send. Try again.';
        } else {
          status.className = 'ok';
          status.textContent = 'Message received. Thank you.';
          form.reset();
        }
      } catch {
        status.className = 'err';
        status.textContent = 'Network error. Try again.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send';
      }
    });
  }

  // ─── Particles canvas ───────────────────────────────
  function startParticles() {
    if (reduceMotion) return;
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      const count = Math.min(80, Math.floor((innerWidth * innerHeight) / 24000));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: (Math.random() * 1.4 + 0.4) * dpr
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();
      }
      // connections
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const max = (120 * dpr) ** 2;
          if (d2 < max) {
            const alpha = 0.08 * (1 - d2 / max);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }

    resize();
    addEventListener('resize', resize, { passive: true });
    tick();
  }

  // ─── Parallax on hero ───────────────────────────────
  function bindParallax() {
    if (reduceMotion) return;
    const glowA = document.querySelector('.glow-a');
    const glowB = document.querySelector('.glow-b');
    if (!glowA && !glowB) return;
    addEventListener('pointermove', (e) => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      if (glowA) glowA.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
      if (glowB) glowB.style.transform = `translate(${x * -40}px, ${y * -40}px)`;
    }, { passive: true });
  }

  // ─── Boot ───────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadLinks();
    bindForm();
    startParticles();
    bindParallax();
  });
})();
