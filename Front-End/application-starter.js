/* 
start.js in your application bro
This script generates a unique fingerprint, requests an encryption key from the server, and decrypts the Ultra Lock script (your application's script).
It then evaluates the decrypted script in memory, allowing your application to run securely.
*/

import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

function getBootID() {
    try {
        return fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf-8').trim();
    } catch (e) {
        return 'BOOTID_UNAVAILABLE';
    }
}

function generateFingerprint() { // you have to use same data as you used in generate-fingerprint.js
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

function decryptUltraLock(base64, key, iv) {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        crypto.createHash('sha256').update(key).digest(),
        Buffer.from(iv, 'utf8')
    );
    let decrypted = decipher.update(base64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

(async () => {
    try {
        const fingerprint = generateFingerprint();
        const token = crypto.createHash('sha256').update(fingerprint).digest('hex');

        const authKey = 'redfox-coders'; // Replace with your internal authKey

        const urlRes = await fetch('https://api.rfc-redfox.com/generate-locked-url', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authKey, fingerprint, token })
        });

        if (!urlRes.ok) throw new Error('❌ URL generation failed This Client is not authorized to run this application');
        const { lockUrl } = await urlRes.json();
        const lockRes = await fetch(lockUrl);

        if (!lockRes.ok) throw new Error('❌ Failed to fetch Ultra Lock');
        const { key, iv } = await urlRes.json();

        const encrypted = await lockRes.text();
        const decrypted = decryptUltraLock(encrypted, key, iv);
        eval(decrypted); // 🔥 Ultra Lock(your application) executed in memory

    } catch (err) {
        console.error('[RFC Secure-Core] ❌ Startup failed:', err.message);
        process.exit(1);
    }
})();
