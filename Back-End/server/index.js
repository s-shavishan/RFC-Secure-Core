// this is A Simple example of a Node.js server
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();

// === Config variables ===
const AUTH_KEY = 'SpartanMD'; // your master secret
const KEY = 'RFC-OnlyExec-Key!'; // AES key
const IV = '1234567890123456';  // 16-byte IV
const VALID_FINGERPRINTS_PATH = path.join(__dirname, 'valid-fingerprints.txt');

// === In-memory one-time token checker ===
const usedTokens = new Set();

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());

app.post('/get-ultra-key', (req, res) => {
  const { authKey, fingerprint, token } = req.body;

  if (authKey !== AUTH_KEY) {
    return res.status(403).json({ error: 'Invalid auth key' });
  }

  // One-time token enforcement
  if (usedTokens.has(token)) {
    return res.status(403).json({ error: 'Token already used' });
  }

  // Token expected to match fingerprint
  const expected = crypto.createHash('sha256').update(fingerprint).digest('hex');
  if (token !== expected) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  // Fingerprint whitelist
  const allowed = fs.readFileSync(VALID_FINGERPRINTS_PATH, 'utf-8')
                    .split('\n').filter(Boolean);
  if (!allowed.includes(fingerprint)) {
    return res.status(403).json({ error: 'Fingerprint not authorized' });
  }

  // OK — mark this token used
  usedTokens.add(token);

  // Deliver key/iv
  return res.json({ key: KEY, iv: IV });
});

app.get('/ultra-lock.encrypted.js', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.type('application/javascript');
  fs.createReadStream(path.join(__dirname, 'ultra-lock.encrypted.js')).pipe(res);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🔐 RFC-Server live on port ${PORT}`));
