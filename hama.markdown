# SECURITY

## What is implemented

- Argon2id password hashing (never plaintext).
- HttpOnly, SameSite=Lax, Secure (in production) session cookies.
- Session regeneration on login.
- CSRF resistance via SameSite cookies + JSON-only API + no state-changing GETs.
- Helmet security headers with a strict Content-Security-Policy.
- HSTS enabled in production (max-age 1y, includeSubDomains, preload).
- CORS whitelist — only the configured origin(s) accepted.
- Rate limiting on all APIs, and stricter limits on `/api/auth/login` and `/api/contact`.
- Server-side Zod validation on every mutation.
- SQL injection safe (parameterized prepared statements only).
- XSS mitigated via CSP + `textContent` on the frontend + strict validation.
- Honeypot field on contact form to blunt dumb bots.
- Request body size limits (16kb) on JSON and URL-encoded bodies.
- No stack traces leaked in production (`NODE_ENV=production`).
- No secrets committed — `.env` is gitignored and `.env.example` is empty.

## Realistic limitations — read carefully

No website is "unhackable." Specifically:

- **XSS via stored content:** the admin's own input is trusted, but a compromised admin account could still inject. CSP reduces, does not eliminate, impact.
- **CSRF:** SameSite=Lax + JSON endpoints mitigate, but not a hard guarantee on all legacy browsers. Add a CSRF token (e.g. `csurf` or double-submit) if you need stricter guarantees.
- **Rate limiting is per-IP.** Distributed attacks (botnets) bypass this. Cloudflare Turnstile or a WAF is recommended at the edge.
- **Session store is SQLite.** Fine for a personal site, not for horizontally scaled deployments — move to Redis/Postgres then.
- **SMTP credentials** live in `.env` on the server. Server compromise = mail compromise. Use a dedicated SMTP relay with scoped keys.
- **SQLite** is a single file. Back it up (`database/deathbyte.db`) regularly and store backups encrypted.
- **Dependency risk:** run `npm audit` regularly and update.
- **DDoS**: rely on Cloudflare, not the Node process.
- **Zero-days** in Node, Express, SQLite, or your OS are out of scope of any application-level hardening.

## Reporting

Email: `security@deathbyte0x.win` (set this up as an alias). Encrypt sensitive reports with PGP if you have a key published.
