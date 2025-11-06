# GeoFence QR Backend (scaffold)

This is a minimal Express + Firebase Admin scaffold for QR generation and verification.

Environment variables (see `.env.example`):
- `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` - service account credentials
- `QR_SIGNING_KEY` - HMAC secret for signing QR tokens (use RSA keys in production)
- `PORT` - server port (default 4000)

Install and run:

```bash
cd backend
npm install
npm run dev
```

Endpoints:
- `POST /generate-qr` (faculty-only) -> { qrToken }
- `POST /verify-scan` (authenticated) -> { success: boolean }

Note: This scaffold does NOT perform persistent storage of attendance. Integrate Firestore writes in `verify-scan` for production.
