'use strict';
const { z } = require('zod');

const linkSchema = z.object({
  label: z.string().trim().min(1).max(60),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => /^https?:\/\//i.test(v), 'URL must start with http(s)://'),
  icon: z
    .string()
    .trim()
    .max(30)
    .regex(/^[a-z0-9_-]+$/i, 'Icon key may only contain letters, digits, - and _')
    .default('link'),
  sort_order: z.number().int().min(0).max(9999).default(0),
  enabled: z.boolean().default(true)
});

const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(60),
  tagline: z.string().trim().min(1).max(140),
  bio: z.string().trim().min(1).max(800),
  avatar_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), 'avatar_url must be a URL or empty')
    .optional()
    .or(z.literal(''))
});

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(10).max(2000),
  // Honeypot — must be empty
  company: z.string().max(0).optional().default('')
});

const loginSchema = z.object({
  username: z.string().trim().min(3).max(60),
  password: z.string().min(8).max(200)
});

function parse(schema, payload, res) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    res.status(400).json({
      error: 'Invalid input.',
      details: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message
      }))
    });
    return null;
  }
  return result.data;
}

module.exports = { linkSchema, profileSchema, contactSchema, loginSchema, parse };
