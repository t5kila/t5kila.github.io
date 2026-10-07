'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('../config/env');

const dbFile = path.resolve(env.dbPath);
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  const schema = fs.readFileSync(
    path.join(__dirname, '..', '..', 'database', 'schema.sql'),
    'utf8'
  );
  db.exec(schema);
  seedDefaults();
  // eslint-disable-next-line no-console
  console.log('[db] schema applied →', dbFile);
}

function seedDefaults() {
  const profile = db.prepare('SELECT COUNT(*) c FROM profile').get();
  if (profile.c === 0) {
    db.prepare(
      `INSERT INTO profile (id, display_name, tagline, bio)
       VALUES (1, ?, ?, ?)`
    ).run(
      'DEATHBYTE',
      'Digital identity. Encrypted presence.',
      'DEATHBYTE is a premium personal hub — a single, secure point of contact across every channel.'
    );
  }

  const links = db.prepare('SELECT COUNT(*) c FROM social_links').get();
  if (links.c === 0) {
    const insert = db.prepare(
      `INSERT INTO social_links (label, url, icon, sort_order, enabled)
       VALUES (?, ?, ?, ?, 1)`
    );
    const defaults = [
      ['Instagram', 'https://instagram.com/deathbyte0x', 'instagram', 1],
      ['Telegram', 'https://t.me/deathbyte0x', 'telegram', 2],
      ['Telegram About', 'https://t.me/about_deathbyte', 'telegram', 3],
      ['WhatsApp', 'https://wa.me/237641041928', 'whatsapp', 4],
      ['Website', 'https://www.deathbyte0x.win', 'globe', 5]
    ];
    for (const l of defaults) insert.run(...l);
  }

  const settings = [
    ['site_title', 'DEATHBYTE'],
    ['site_description', 'DEATHBYTE — premium digital identity and secure contact hub.'],
    ['contact_enabled', '1']
  ];
  const ins = db.prepare(
    'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)'
  );
  for (const s of settings) ins.run(...s);
}

// Expose helpers used across the app
const q = {
  getProfile: () => db.prepare('SELECT * FROM profile WHERE id = 1').get(),
  updateProfile: (p) =>
    db
      .prepare(
        `UPDATE profile SET display_name=?, tagline=?, bio=?, avatar_url=?, updated_at=datetime('now') WHERE id=1`
      )
      .run(p.display_name, p.tagline, p.bio, p.avatar_url || null),

  listLinks: (onlyEnabled = false) =>
    db
      .prepare(
        `SELECT * FROM social_links ${onlyEnabled ? 'WHERE enabled=1' : ''} ORDER BY sort_order ASC, id ASC`
      )
      .all(),
  getLink: (id) => db.prepare('SELECT * FROM social_links WHERE id=?').get(id),
  createLink: (l) =>
    db
      .prepare(
        `INSERT INTO social_links (label, url, icon, sort_order, enabled) VALUES (?, ?, ?, ?, ?)`
      )
      .run(l.label, l.url, l.icon, l.sort_order ?? 0, l.enabled ? 1 : 0),
  updateLink: (id, l) =>
    db
      .prepare(
        `UPDATE social_links SET label=?, url=?, icon=?, sort_order=?, enabled=? WHERE id=?`
      )
      .run(l.label, l.url, l.icon, l.sort_order ?? 0, l.enabled ? 1 : 0, id),
  deleteLink: (id) => db.prepare('DELETE FROM social_links WHERE id=?').run(id),

  createMessage: (m) =>
    db
      .prepare(
        `INSERT INTO contact_messages (name, email, message, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?)`
      )
      .run(m.name, m.email, m.message, m.ip_hash || null, m.user_agent || null),
  listMessages: () =>
    db
      .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500')
      .all(),
  markMessageRead: (id) =>
    db.prepare('UPDATE contact_messages SET read=1 WHERE id=?').run(id),

  findAdmin: (username) =>
    db.prepare('SELECT * FROM admin_users WHERE username=?').get(username),
  touchAdminLogin: (id) =>
    db.prepare(`UPDATE admin_users SET last_login=datetime('now') WHERE id=?`).run(id),

  getSetting: (key) =>
    db.prepare('SELECT value FROM site_settings WHERE key=?').get(key)?.value,
  setSetting: (key, value) =>
    db
      .prepare(
        `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`
      )
      .run(key, value)
};

module.exports = { db, migrate, q };
