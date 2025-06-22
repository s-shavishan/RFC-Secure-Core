/*
generate-locked-url.js

very simple script to generate a locked URL for secure access to a file
- one time access -
*/
import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load valid fingerprints
const VALID_FINGERPRINTS = fs.readFileSync('./fingerprints.txt', 'utf-8')
  .split('\n')
  .map(f => f.trim())
  .filter(Boolean);

const tempUrlStore = new Map();

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function getLockKey() {
  return process.env.LOCK_KEY || 'RFC_SUPER_KEY';
}

function getIV() {
  return process.env.LOCK_IV || 'RedFoxSecureInitV'; // 16 chars
}

router.post('/generate-locked-url', (req, res) => {
  const { fingerprint, token, authKey } = req.body;

  if (!fingerprint || !token || !authKey)
    return res.status(400).json({ error: 'Missing required fields' });

  const expectedToken = crypto.createHash('sha256').update(fingerprint).digest('hex');
  if (token !== expectedToken)
    return res.status(401).json({ error: 'Invalid token' });

  if (authKey !== 'redfox-coders')
    return res.status(401).json({ error: 'Invalid authKey' });

  if (!VALID_FINGERPRINTS.includes(fingerprint))
    return res.status(403).json({ error: 'Fingerprint not approved' });

  const oneTimeId = generateToken();
  const expiresAt = Date.now() + 1000 * 60 * 2; // 2 minutes expiry
  tempUrlStore.set(oneTimeId, { expiresAt });

  const lockUrl = `https://cdn.rfc-redfox.com/secure-access/${oneTimeId}`;

  return res.json({ lockUrl, key: getLockKey(), iv: getIV() });
});

router.get('/secure-access/:token', (req, res) => {
  const { token } = req.params;
  const entry = tempUrlStore.get(token);

  if (!entry) return res.status(404).send('Link expired or invalid');
  if (Date.now() > entry.expiresAt) {
    tempUrlStore.delete(token);
    return res.status(403).send('Link expired');
  }

  tempUrlStore.delete(token); // one-time use

  const filePath = path.join(process.cwd(), 'assets', 'ultra-lock.encrypted.js');
  if (!fs.existsSync(filePath)) return res.status(500).send('Lock file missing');

  return res.sendFile(filePath);
});

export default router;
