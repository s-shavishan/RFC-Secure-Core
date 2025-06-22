/*

||- we are suggesting you to make your own logic instead of our example fingerprint gen -||

- Simple script example that generates a unique fingerprint -
✅ It includes:

- Host info
- Platform + CPU
- CWD
- /proc/sys/kernel/random/boot_id
- Optional .env secret

You can now tell users:
“Run .generate-fingerprint.js and DM me the result. Once I approve it, your application will unlock.”

*/

const os = require('os');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

function getBootID() {
  try {
    return fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf-8').trim();
  } catch (err) {
    return 'BOOTID_UNAVAILABLE';
  }
}

function generateFingerprint() {
  const data = [
    os.hostname(),
    os.platform(),
    os.release(),
    JSON.stringify(os.cpus()[0]),
    Math.round(os.totalmem() / 1024 / 1024),
    process.cwd(),
    getBootID(),
    process.env.RFC_AUTH_SECRET || ''
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex');
}

const fingerprint = generateFingerprint();

console.log('🔐 RFC Fingerprint:', fingerprint);
console.log('📋 Copy & send this to the developer for approval.');
