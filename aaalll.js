'use strict';
const express = require('express');
const argon2 = require('argon2');
const { q } = require('../services/db');
const { loginSchema, parse } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/security');

const router = express.Router();

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const data = parse(loginSchema, req.body, res);
    if (!data) return;

    const user = q.findAdmin(data.username);
    // Constant-ish time: always verify against a hash
    const dummyHash =
      '$argon2id$v=19$m=65536,t=3,p=4$YWFhYWFhYWFhYWFhYWFhYQ$YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE';
    const ok = user
      ? await argon2.verify(user.password_hash, data.password).catch(() => false)
      : await argon2.verify(dummyHash, data.password).catch(() => false);

    if (!user || !ok) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.adminId = user.id;
      req.session.username = user.username;
      q.touchAdminLogin(user.id);
      res.json({ ok: true, username: user.username });
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => {
    res.clearCookie('db.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ authenticated: true, username: req.session.username });
  }
  res.json({ authenticated: false });
});

module.exports = router;
