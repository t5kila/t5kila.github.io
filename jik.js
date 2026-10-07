'use strict';
const express = require('express');
const crypto = require('crypto');
const { q } = require('../services/db');
const { sendContact } = require('../services/mailer');
const { contactSchema, parse } = require('../middleware/validate');
const { contactLimiter, apiLimiter } = require('../middleware/security');
const env = require('../config/env');

const router = express.Router();

router.get('/profile', apiLimiter, (req, res) => {
  const profile = q.getProfile();
  const settings = {
    contact_enabled: q.getSetting('contact_enabled') === '1'
  };
  res.json({ profile, settings });
});

router.get('/links', apiLimiter, (req, res) => {
  res.json({ links: q.listLinks(true) });
});

router.post('/contact', contactLimiter, async (req, res, next) => {
  try {
    const data = parse(contactSchema, req.body, res);
    if (!data) return;

    // Honeypot check (silently succeed on bots)
    if (data.company && data.company.length > 0) {
      return res.status(202).json({ ok: true });
    }

    const ip = req.ip || '';
    const ip_hash = crypto
      .createHash('sha256')
      .update(ip + env.sessionSecret)
      .digest('hex')
      .slice(0, 32);

    q.createMessage({
      name: data.name,
      email: data.email,
      message: data.message,
      ip_hash,
      user_agent: (req.get('user-agent') || '').slice(0, 300)
    });

    try {
      await sendContact(data);
    } catch (err) {
      // Log server-side only; user doesn't need to see SMTP failure
      // eslint-disable-next-line no-console
      console.error('[contact] mail delivery failed:', err.message);
    }

    res.status(201).json({ ok: true, message: 'Message received.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
