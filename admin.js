'use strict';
const express = require('express');
const { q } = require('../services/db');
const { requireAuth } = require('../middleware/auth');
const {
  linkSchema,
  profileSchema,
  parse
} = require('../middleware/validate');

const router = express.Router();
router.use(requireAuth);

// ── Profile ────────────────────────────────────────────
router.get('/profile', (req, res) => {
  res.json({ profile: q.getProfile() });
});

router.put('/profile', (req, res) => {
  const data = parse(profileSchema, req.body, res);
  if (!data) return;
  q.updateProfile(data);
  res.json({ ok: true, profile: q.getProfile() });
});

// ── Links ──────────────────────────────────────────────
router.get('/links', (req, res) => {
  res.json({ links: q.listLinks(false) });
});

router.post('/links', (req, res) => {
  const data = parse(linkSchema, req.body, res);
  if (!data) return;
  const info = q.createLink(data);
  res.status(201).json({ ok: true, link: q.getLink(info.lastInsertRowid) });
});

router.put('/links/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.' });
  if (!q.getLink(id)) return res.status(404).json({ error: 'Link not found.' });
  const data = parse(linkSchema, req.body, res);
  if (!data) return;
  q.updateLink(id, data);
  res.json({ ok: true, link: q.getLink(id) });
});

router.delete('/links/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.' });
  const info = q.deleteLink(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Link not found.' });
  res.json({ ok: true });
});

// ── Messages ───────────────────────────────────────────
router.get('/messages', (req, res) => {
  res.json({ messages: q.listMessages() });
});

router.put('/messages/:id/read', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id.' });
  q.markMessageRead(id);
  res.json({ ok: true });
});

// ── Settings ───────────────────────────────────────────
router.get('/settings', (req, res) => {
  res.json({
    settings: {
      site_title: q.getSetting('site_title'),
      site_description: q.getSetting('site_description'),
      contact_enabled: q.getSetting('contact_enabled') === '1'
    }
  });
});

router.put('/settings', (req, res) => {
  const allowed = ['site_title', 'site_description', 'contact_enabled'];
  const body = req.body || {};
  for (const key of allowed) {
    if (key in body) {
      const value =
        typeof body[key] === 'boolean' ? (body[key] ? '1' : '0') : String(body[key]).slice(0, 300);
      q.setSetting(key, value);
    }
  }
  res.json({ ok: true });
});

module.exports = router;
