<p align="center">
  <img
    src="https://github.com/user-attachments/assets/266f4c06-61fa-4861-b4d8-515f127b9c74"
    alt="Nomi — Closer, every day."
    width="100%"
  />
</p>

<p align="center">
  <strong>A private couples companion for iOS, Android, and the web.</strong><br/>
  Share moods, moments, memories, countdowns, messages, and widgets in one private space. ❤️
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-in%20development-f59e0b?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/project-private-7c3aed?style=for-the-badge" alt="Private" />
  <img src="https://img.shields.io/badge/license-proprietary-111827?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Capacitor-iOS%20%7C%20Android-119EFF?style=flat-square&logo=capacitor&logoColor=white" alt="Capacitor" />
  <img src="https://img.shields.io/badge/Node.js-backend-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-database-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/PWA-supported-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/iOS-WidgetKit-000000?style=flat-square&logo=apple&logoColor=white" alt="WidgetKit" />
  <img src="https://img.shields.io/badge/Android-Jetpack%20Glance-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Jetpack Glance" />
  <img src="https://img.shields.io/badge/realtime-WebSocket-010101?style=flat-square" alt="WebSocket" />
  <img src="https://img.shields.io/badge/deployment-self--hosted-0f172a?style=flat-square" alt="Self Hosted" />
</p>

---

# ❤️ Nomi

> **Closer, every day.**

**Nomi** is a privacy-first couples app built around one simple idea: help two people feel connected without turning the relationship into another noisy social network.

The first deployment is designed for **one private couple**, while the architecture keeps couple data isolated so the product can grow into a multi-couple SaaS later.

---

## ✨ What Nomi Does

| Feature | What it gives you |
|---|---|
| 🔐 **Private Pairing** | Securely connect two accounts with one-time invitations |
| 🏠 **Couple Home** | See your partner, mood, activity, relationship days, and next event |
| 😊 **Mood Sharing** | Share how you feel with an optional note |
| 📚 **Activity Status** | Working, studying, sleeping, relaxing, busy, custom, and more |
| ❤️ **Relationship Counter** | Track days together, anniversaries, and milestones |
| ⏳ **Countdowns** | Dates, trips, birthdays, anniversaries, and special moments |
| 📅 **Shared Calendar** | Private events, reminders, and upcoming plans |
| 📸 **Memories** | Save photos, captions, dates, tags, and reactions |
| 📖 **Couple Diary** | Shared private journal with moods and photos |
| 💬 **Messaging** | Lightweight realtime private chat |
| 💞 **Quick Interactions** | Send ❤️ 😘 🤗 🥰 without starting a conversation |
| 🔔 **Push Notifications** | APNs on iOS and FCM on Android |
| 🧩 **Native Widgets** | iOS Home/Lock Screen + Android Home Screen widgets |
| 🌐 **PWA** | Installable web experience using the shared frontend |

---

## 🏠 Couple Home

A quick glance should tell you what matters:

```text
┌──────────────────────────────┐
│ ❤️ Nomi                      │
│                              │
│ Sara                         │
│ 😊 Happy · 📚 Studying       │
│                              │
│ Together · 428 days          │
│ Dinner · in 4 days           │
│                              │
│ ❤️   😘   🤗   ✨           │
└──────────────────────────────┘
```

---

## 🧩 Widgets

Widgets are a **core feature**, not an afterthought.

| Platform | Technology | Widgets |
|---|---|---|
| 🍎 **iOS** | SwiftUI + WidgetKit + App Groups | Partner Status, Relationship, Countdown, Quick Interaction, Lock Screen |
| 🤖 **Android** | Kotlin + Jetpack Glance | Partner Status, Relationship, Countdown, Quick Interaction |

Widget data should support:

- 📴 cached/offline state
- 🕐 stale-data awareness
- 🔗 deep links
- 🔄 safe refreshes
- 🛡️ authenticated actions
- 💀 process-death recovery on Android

---

## 🧱 Architecture

```text
                         Internet
                            │
                        HTTPS/WSS
                            │
                      Reverse Proxy
                     ┌──────┴──────┐
                     │             │
                React / PWA      API
                                   │
                          Node.js + TypeScript
                                   │
               ┌───────────────────┼──────────────────┐
               │                   │                  │
          PostgreSQL           Realtime          Notifications
                              WebSocket           APNs / FCM

        ┌───────────────────────────┴───────────────────────────┐
        │                                                       │
      iPhone                                                 Android
        │                                                       │
 Capacitor + React                                      Capacitor + React
        │                                                       │
    WidgetKit                                           Jetpack Glance
```

### Architecture Philosophy

Nomi uses a **modular monolith**:

- ✅ one backend
- ✅ one primary PostgreSQL database
- ✅ clear domain modules
- ✅ simple Docker deployment
- ✅ low operational overhead
- ❌ no Kubernetes
- ❌ no service mesh
- ❌ no ceremonial microservices

The goal is a system boring enough to operate reliably. A rare engineering luxury.

---

## 🛠️ Tech Stack

| Area | Stack |
|---|---|
| 🎨 **Frontend** | React, TypeScript, Vite, PWA |
| 📱 **Mobile** | Capacitor |
| 🍎 **iOS Native** | Swift, SwiftUI, WidgetKit, APNs |
| 🤖 **Android Native** | Kotlin, Jetpack Glance, FCM |
| ⚙️ **Backend** | Node.js, TypeScript, REST API |
| ⚡ **Realtime** | WebSocket |
| 🗄️ **Database** | PostgreSQL |
| 📦 **Infrastructure** | Docker, Docker Compose, Reverse Proxy |
| 🖥️ **Hosting** | Private Linux VPS |

---

## 🔐 Privacy & Security

Nomi handles sensitive relationship data, so privacy is part of the product design.

### Privacy by default

Nomi should **not** enable these automatically:

- 📍 continuous GPS tracking
- 🎙️ microphone monitoring
- 👥 contact scraping
- 📊 invasive analytics
- 📱 automatic sensor/activity monitoring

Sensitive sharing must always be:

**visible → consensual → revocable**

### Security baseline

| Area | Requirement |
|---|---|
| 🔑 Authentication | Strong password hashing, session revocation, refresh-token rotation |
| 👫 Couple Isolation | Every couple-owned resource is scoped to the authenticated couple |
| 🚦 Abuse Protection | Rate limiting + brute-force protection |
| 📤 Uploads | MIME/size validation and private access |
| ⚡ Realtime | Authenticated and authorized WebSocket connections |
| 🧪 Validation | Validate REST, realtime, environment, and external inputs |
| 🔒 Secrets | Never commit `.env`, signing keys, tokens, or provider credentials |
| 🧾 Auditing | Track important security/account actions where appropriate |

Conceptually, couple-owned queries should behave like:

```sql
SELECT *
FROM memories
WHERE id = :memory_id
  AND couple_id = :authorized_couple_id;
```

Never trust a resource ID by itself. That is how software creates surprise relationships nobody asked for.

---

## 🔔 Realtime & Notifications

### Realtime updates

- 😊 mood changes
- 📚 activity changes
- 💞 quick interactions
- 💬 messages
- ⏳ countdown changes
- 📅 calendar changes

### Push providers

```text
NotificationService
├── 🍎 APNsProvider
└── 🤖 FCMProvider
```

Users should be able to control notification categories individually.

---

## 📴 Offline Experience

Nomi should still feel useful when the connection disappears at the least convenient possible moment.

Cache:

- partner status
- relationship metadata
- upcoming events
- recent memories
- widget snapshot

The UI should clearly distinguish:

`online` · `offline` · `stale` · `retrying` · `failed`

---

## 🗂️ Repository

<details>
<summary><strong>Suggested structure</strong></summary>

```text
nomi/
├── apps/
│   ├── client/
│   │   ├── src/
│   │   ├── public/
│   │   ├── android/
│   │   └── ios/
│   └── server/
│       ├── src/
│       └── tests/
│
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── api-client/
│   ├── domain-contracts/
│   └── config/
│
├── infrastructure/
│   ├── docker/
│   ├── proxy/
│   ├── scripts/
│   └── monitoring/
│
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── docker-compose.production.yml
├── .env.example
├── AGENTS.md
├── CONTRIBUTING.md
└── README.md
```

Existing good repository conventions should win over this suggested layout.

</details>

---

## 🚀 Development

### Requirements

| General | Android | iOS |
|---|---|---|
| Node.js LTS | Android Studio | macOS |
| Docker | Android SDK | Xcode |
| Docker Compose | Java/JDK | Apple signing |
| Git |  |  |

<details>
<summary><strong>Local setup</strong></summary>

```bash
git clone <repository-url>
cd nomi

cp .env.example .env
npm install
npm run dev
```

Docker development:

```bash
docker compose up --build
```

</details>

---

## 🖥️ VPS Deployment

Nomi's server-side stack is designed for a normal Linux VPS.

### Production topology

```text
Private VPS
├── 🌐 reverse-proxy
├── 🎨 web
├── ⚙️ api
└── 🗄️ postgres
    └── persistent volume
```

### Deploy

```bash
git clone <repository-url>
cd nomi
cp .env.example .env

# configure production secrets

docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Check services:

```bash
docker compose -f docker-compose.production.yml ps
```

Logs:

```bash
docker compose -f docker-compose.production.yml logs -f
```

> 🍎 **Important:** Docker on Linux deploys the backend/web stack. Final iOS builds still require **macOS + Xcode + Apple signing**.

---

## 📱 Mobile Builds

| Platform | Build Path | Output |
|---|---|---|
| 🤖 Android | Linux / Android Studio / CI | APK / AAB |
| 🍎 iOS | macOS + Xcode | Signed iOS build / archive |

### Android

```bash
npm run build
npx cap sync android
npx cap open android
```

See `docs/mobile/ANDROID_BUILD.md`.

### iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

See `docs/mobile/IOS_BUILD.md`.

Signing credentials, keystores, Apple keys, and certificates must never be committed.

---

## 🗄️ API & Data

API base:

```text
/api/v1
```

Core domains:

| Domain | Examples |
|---|---|
| 👤 Account | `auth`, `users`, `devices` |
| 👫 Couple | `couples`, `pairing` |
| 😊 Presence | `status`, `moods`, `activities` |
| 📅 Planning | `events`, `countdowns` |
| 📖 Shared Life | `diary`, `memories` |
| 💬 Connection | `messages`, `interactions` |
| 🔔 Platform | `notifications`, `widgets` |

PostgreSQL remains the **system of record** with:

- versioned migrations
- indexes and foreign keys
- transactions
- backups
- restore documentation

---

## 🩺 Health & Operations

Production API:

```text
/health/live
/health/ready
```

| Check | Purpose |
|---|---|
| ❤️ `/health/live` | Is the application process alive? |
| ✅ `/health/ready` | Are configuration, DB, migrations, and startup ready? |

Minimum observability:

- structured logs
- request/correlation IDs
- error reporting boundary
- failed-job visibility
- push-delivery failures
- database backups

A backup that has never been restored is just a motivational file.

---

## 🧪 Quality Gates

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

### Critical E2E Journey

```text
👤 A registers
   ↓
👤 B registers
   ↓
🔗 A invites B
   ↓
❤️ B accepts
   ↓
😊 A changes mood
   ↓
⚡ B sees update
   ↓
💞 B sends ❤️
   ↓
🔔 A receives it
   ↓
⏳ A creates countdown
   ↓
📱 B sees countdown
```

CI should validate lint, types, tests, security checks, migrations, client/server builds, and Docker builds.

---

## 🤖 AgenticOS

Nomi is designed to be developed and maintained through the repository's **AgenticOS** orchestration layer.

```text
🧠 PLAN
   ↓
🛠️ IMPLEMENT
   ↓
🔍 SELF REVIEW
   ↓
👥 SPECIALIST REVIEW
   ↓
🧪 TEST
   ↓
🛡️ SECURITY CHECK
   ↓
📝 DOCUMENT
   ↓
✅ ACCEPTANCE GATE
```

The orchestration system should:

- inspect the repo before changing it
- read `AGENTS.md`
- route work to the right specialists
- use relevant skills and references
- test and review changes
- record useful lessons
- update reusable experience
- track project progress

Project status lives in:

```text
docs/project/IMPLEMENTATION_STATUS.md
```

---

## 🗺️ Roadmap

| Phase | Scope |
|---|---|
| 🔎 **0–2** | Discovery, Architecture, Foundation |
| 🔐 **3–4** | Authentication + Couple Pairing |
| 🏠 **5–6** | Dashboard + Mood/Status |
| 📅 **7–8** | Calendar, Countdowns, Diary, Memories |
| 💬 **9–11** | Messaging, Realtime, Push |
| 📱 **12–14** | Mobile Integration + iOS/Android Widgets |
| 📴 **15** | Offline Support |
| 🛡️ **16** | Security Hardening |
| 🧪 **17** | Testing |
| 🐳 **18** | Docker + VPS Production |
| 🚀 **19** | Release |

---

## 🔮 Later, Not V1

Possible future features:

`Sign in with Apple` · `Google` · `Passkeys` · `Apple Watch` · `Wear OS` · `Voice Messages` · `Video Messages` · `Shared Goals` · `Couple Challenges` · `Private Location Sharing` · `Optional Battery Sharing` · `Smart Reminders` · `Relationship Insights` · `E2EE using established protocols` · `SaaS Billing`

### 🚫 Explicit V1 Non-Goals

`Public Social Network` · `AI Relationship Therapy` · `Continuous GPS Tracking` · `Voice/Video Calling` · `Marketplace` · `Payments` · `Microservices` · `Kubernetes` · `Custom Cryptography`

---

## ✅ Production Checklist

| Area | Done when... |
|---|---|
| 🧱 Build | Client + server + production Docker images build |
| 🗄️ Database | Migrations pass and backup/restore is validated |
| 🧪 Quality | Lint, types, unit, integration, and E2E tests pass |
| 🛡️ Security | Auth, authorization, secrets, uploads, realtime, and couple isolation reviewed |
| 🤖 Android | App builds, push documented, widget works |
| 🍎 iOS | Xcode project builds, WidgetKit works, signing/push documented |
| 🌐 Production | HTTPS, health checks, logs, deployment, and rollback documented |
| 📝 Handoff | Remaining blockers and release instructions are recorded |

---

## 🎨 Brand

| | |
|---|---|
| **Name** | **Nomi** |
| **Tagline** | **Closer, every day.** |
| **Personality** | Warm · intimate · modern · quiet · trustworthy · premium |

Recommended assets:

```text
docs/assets/
├── nomi-logo.png
├── nomi-icon.png
├── nomi-banner.png
├── screenshots/
└── brand/
```

---

## 📚 Documentation

Detailed engineering information belongs in `docs/`, not in a README large enough to qualify as light bedtime reading.

```text
docs/
├── architecture/   # system, data, realtime, mobile, widgets, ADRs
├── api/            # API contracts
├── deployment/     # VPS, release, rollback
├── development/    # local development and testing
├── mobile/         # iOS, Android, widgets
├── operations/     # backup, monitoring, incidents
├── product/        # requirements and feature matrix
├── project/        # plan and implementation status
└── security/       # security model and secrets
```

---

## 📄 License

**Private & Proprietary**

```text
Copyright © Nomi.
All rights reserved.
```

Do not redistribute source code, private assets, credentials, or proprietary documentation without authorization.

---

<p align="center">
  <strong>❤️ Nomi</strong><br/>
  <em>Closer, every day.</em>
</p>
