'use strict';
require('dotenv').config();

const required = ['SESSION_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required variable: ${key}`);
    process.exit(1);
  }
}

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  isProd,
  port: parseInt(process.env.PORT || '3000', 10),
  siteOrigin: process.env.SITE_ORIGIN || 'https://www.deathbyte0x.win',
  devOrigin: process.env.DEV_ORIGIN || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET,
  dbPath: process.env.DB_PATH || './database/deathbyte.db',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    to: process.env.CONTACT_TO || 'inbox@deathbyte0x.win',
    from: process.env.CONTACT_FROM || 'no-reply@deathbyte0x.win'
  }
};
