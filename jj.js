'use strict';
const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
if (env.smtp.host && env.smtp.user && env.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass }
  });
}

async function sendContact({ name, email, message }) {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn('[mailer] SMTP not configured — message stored in DB only.');
    return { delivered: false };
  }
  await transporter.sendMail({
    from: `"DEATHBYTE" <${env.smtp.from}>`,
    to: env.smtp.to,
    replyTo: email,
    subject: `New DEATHBYTE contact from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`
  });
  return { delivered: true };
}

module.exports = { sendContact };
