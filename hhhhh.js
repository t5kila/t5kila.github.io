'use strict';
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const env = require('../config/env');

function applySecurity(app) {
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: env.isProd ? [] : null
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: env.isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false
    })
  );

  app.use(hpp());

  // Strict CORS — only same origin + configured dev origin
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = [env.siteOrigin, env.devOrigin];
    if (origin && allowed.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
      return res.sendStatus(204);
    }
    next();
  });

  // Size limits
  app.use(require('express').json({ limit: '16kb' }));
  app.use(require('express').urlencoded({ extended: false, limit: '16kb' }));
}

// Global limiter for all API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' }
});

// Login limiter — much stricter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' }
});

// Contact limiter
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please wait before sending another.' }
});

module.exports = { applySecurity, apiLimiter, loginLimiter, contactLimiter };
