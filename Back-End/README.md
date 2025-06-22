# 🔐 Endpoint: `GET /ultra-lock.encrypted.js`

Place your encrypted code at:

```
server/ultra-lock.encrypted.js
```

## Serving Instructions

- Serve the file with **strict CORS** headers so that only your loader can fetch it.
- Example CORS header for a specific loader origin:

    ```http
    Access-Control-Allow-Origin: https://your-loader-domain.com
    Access-Control-Allow-Methods: GET
    Access-Control-Allow-Headers: Content-Type
    ```

- Ensure no other origins are permitted.

---
- Store sensitive code only in the encrypted file.
- Never expose the decryption key or logic in this endpoint.

## 🔑 Secure Workflow

On bot startup, a fingerprint `F = sha256(host|cpu|...)` is computed.

The bot generates `T = sha256(F)` and sends `{authKey, fingerprint: F, token: T}` to `/get-ultra-key`.

The server verifies:
- The master `authKey`
- The fingerprint is whitelisted
- The token matches and hasn't been used

If valid, the server responds with `{key, iv}`.

The bot then fetches the encrypted code, decrypts it in RAM, and evaluates it.

---

### 🛠️ Operational Checklist

- Add new fingerprints to `server/valid-fingerprints.txt` after manual review.
- Rotate AES key/IV as needed.
- Always host the server over HTTPS.
- Never expose decryption keys or logic to clients.
- Review access logs for unauthorized attempts.