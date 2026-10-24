# ScamShield MVP

ScamShield is an AI-powered universal scam detection and verification system. The MVP turns the reference concept into a working product surface: a secure command center, multi-input scanner, explainable risk results, scan history, community reporting, and protection settings.

## Implemented stack

| Layer | Implementation |
| --- | --- |
| Frontend | React 19 + TypeScript + Tailwind CSS 4 + Lucide icons |
| Backend | Node.js + Express runtime + tRPC procedures for typed API contracts |
| Persistence | Drizzle ORM on the managed MySQL/TiDB database supplied by the WebDev full-stack scaffold |
| AI/ML | Explainable signal engine in TypeScript, with a Python service contract prepared for scikit-learn, NLP, and OCR |
| APIs | Typed tRPC procedures under `/api/trpc`; the analysis and community-report contracts are ready to be exposed through REST adapters if required |
| Security | Manus OAuth session flow, JWT-signed session cookie infrastructure, protected data procedures, and safe no-database fallbacks |
| Delivery | Dockerfile with Node.js, Python 3, scikit-learn, NLTK, Pillow, and Tesseract OCR support |

## Product workflow

1. A user pastes suspicious content and selects its input type.
2. The analyzer detects urgency, credential requests, payment requests, suspicious links, impersonation cues, and unrealistic offers.
3. ScamShield returns a 0–100 risk score, risk band, scam category, matched reasons, and a recommended next action.
4. Authenticated scans are persisted as history. Community reports are stored in a shared intelligence queue.
5. The dashboard summarizes scans, blocked threats, community reports, coverage, and recent activity.

## Current data model

- `users`: Manus OAuth-backed user identity and role.
- `scamScans`: submitted content preview, source type, score, band, scam type, reasons, recommendation, and timestamp.
- `communityReports`: user-submitted category, description, severity, review status, and timestamp.

## Production hardening roadmap

The current scoring engine is intentionally deterministic and explainable so the MVP works without a model server. The scam analysis is fully implemented in TypeScript using 70+ detection patterns across 12 scam categories. Future enhancements could include training ML models on reviewed scam examples and adding OCR extraction for images. A MongoDB repository adapter can be added when a MongoDB deployment and connection secret is available; the current runtime uses an in-memory fallback or SQL database for reliable operation.

The app should also add rate limiting, content redaction before persistence, abuse monitoring, verified-source allowlists, and human review for high-impact decisions. ScamShield is an assistive security tool and should not be treated as a substitute for official verification.
