# Nomi

<p align="center">
  <img src="./docs/assets/nomi-logo.png" alt="Nomi Logo" width="160" />
</p>

<h3 align="center">Closer, every day.</h3>

<p align="center">
  A private couples companion app for iOS, Android, and the web.
  <br />
  Share moods, moments, memories, countdowns, messages, and widgets in one private space.
</p>

<p align="center">

![Status](https://img.shields.io/badge/status-in%20development-f59e0b?style=for-the-badge)
![Private](https://img.shields.io/badge/project-private-7c3aed?style=for-the-badge)
![License](https://img.shields.io/badge/license-proprietary-111827?style=for-the-badge)

</p>

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-iOS%20%7C%20Android-119EFF?style=flat-square&logo=capacitor&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-backend-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-supported-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

</p>

<p align="center">

![Android](https://img.shields.io/badge/Android-native%20shell-3DDC84?style=flat-square&logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-native%20shell-000000?style=flat-square&logo=apple&logoColor=white)
![WidgetKit](https://img.shields.io/badge/iOS-WidgetKit-000000?style=flat-square&logo=apple&logoColor=white)
![Jetpack Glance](https://img.shields.io/badge/Android-Jetpack%20Glance-3DDC84?style=flat-square&logo=android&logoColor=white)
![WebSocket](https://img.shields.io/badge/realtime-WebSocket-010101?style=flat-square)
![Self Hosted](https://img.shields.io/badge/deployment-self--hosted-0f172a?style=flat-square)

</p>

---

## Overview

**Nomi** is a privacy-first couples companion application designed for two people to stay connected throughout everyday life.

Instead of being another general-purpose social network or bloated chat platform, Nomi focuses on a private shared space between partners.

Nomi combines:

- partner status
- moods
- activity sharing
- relationship milestones
- shared countdowns
- calendar events
- memories
- diary entries
- lightweight messaging
- affectionate interactions
- push notifications
- iOS Home Screen and Lock Screen widgets
- Android Home Screen widgets

The initial deployment is designed for private use by one couple, while the data model and authorization architecture remain suitable for future multi-couple SaaS expansion.

---

# Product Vision

> **Closer, every day.**

Nomi should feel:

- personal
- calm
- warm
- private
- modern
- fast
- intimate without becoming childish
- simple enough to use every day

The application should provide small, meaningful ways for partners to remain connected without requiring them to constantly open a full chat application.

---

# Core Features

## Couple Pairing

Securely connect two accounts into one private relationship space.

Features:

- one-time invitation
- expiring pairing token
- explicit acceptance
- invitation revocation
- duplicate pairing protection
- secure unlinking
- couple-scoped authorization

---

## Partner Dashboard

The Home screen provides a quick view of:

- partner name and avatar
- current mood
- current activity
- last update time
- relationship duration
- next important event
- recent interaction
- recent memory
- quick affection actions

Example:

```text
┌──────────────────────────────┐
│ Nomi                         │
│                              │
│ Sara                         │
│ 😊 Happy                     │
│ 📚 Studying                  │
│                              │
│ Together                     │
│ 428 days                     │
│                              │
│ Next                         │
│ Dinner · 4 days              │
│                              │
│ ❤️   😘   🤗   ✨           │
└──────────────────────────────┘
```

---

## Mood Sharing

Partners can share their current mood.

Examples:

- 😊 Happy
- 🥰 Loved
- 😌 Relaxed
- 🤩 Excited
- 😴 Tired
- 😔 Sad
- 😣 Stressed
- 😡 Angry
- ❤️ Missing you
- 🧠 Focused
- ✨ Custom

Mood updates may include:

- optional note
- timestamp
- expiry
- notification preference
- history

---

## Activity & Status

Share what you are currently doing.

Examples:

- working
- studying
- sleeping
- exercising
- commuting
- relaxing
- busy
- available
- custom

Status updates support realtime synchronization and widgets.

Nomi intentionally avoids invasive tracking by default.

Features such as:

- continuous location
- battery level
- sensor-based activity detection

must remain explicit opt-in capabilities.

---

# Relationship Counter

Track important relationship milestones.

Supports:

- relationship start date
- days together
- anniversary dates
- upcoming milestone
- countdowns

Example:

```text
❤️ Together for

428 days

Next anniversary
42 days
```

---

# Shared Countdowns

Create countdowns for important moments.

Examples:

- next date
- trip
- birthday
- anniversary
- meeting
- celebration

Countdowns can appear inside:

- app dashboard
- iOS widgets
- Android widgets
- notifications

---

# Shared Calendar

A lightweight private calendar for the couple.

Supports:

- timed events
- all-day events
- reminders
- recurring events where appropriate
- timezone-aware dates
- upcoming event list

External calendar integrations may be added later.

---

# Memories

Store meaningful shared moments.

A memory may contain:

- photos
- caption
- date
- tags
- author
- optional location label
- reactions

Media access must remain private and authorization-protected.

---

# Couple Diary

A private shared diary.

Entries can contain:

- title
- text
- mood
- date
- author
- tags
- photos

Features:

- create
- edit
- delete
- search
- chronological timeline

---

# Messaging

Nomi includes lightweight private messaging.

Initial scope:

- text messages
- timestamps
- realtime delivery
- reactions
- reply support

Possible future additions:

- photos
- voice messages
- GIFs
- stickers
- video messages

Nomi is intentionally **not** trying to become Discord wearing a heart-shaped hat.

---

# Quick Interactions

Send small affectionate signals without starting a conversation.

Examples:

- ❤️ Love
- 😘 Kiss
- 🤗 Hug
- 🥰 Thinking of you
- ✨ Custom signal

These interactions can trigger:

- realtime updates
- push notifications
- widget actions where supported

---

# Native Widgets

Widgets are a first-class Nomi feature.

## iOS

Implemented using:

- Swift
- SwiftUI
- WidgetKit
- App Groups

Planned widgets:

### Couple Status

Shows:

- partner
- mood
- activity
- last update

### Relationship

Shows:

- days together
- milestone
- next anniversary

### Countdown

Shows:

- next event
- countdown

### Quick Interaction

Where supported:

- ❤️
- 😘
- 🤗

### Lock Screen

Compact widgets for:

- partner status
- relationship days
- next event

---

## Android

Implemented using:

- Kotlin
- Jetpack Glance

Planned widgets:

- Couple Status
- Relationship Counter
- Countdown
- Quick Interaction

Widgets must support:

- offline cached state
- stale state
- safe refreshes
- deep links
- process death recovery

---

# Architecture

```text
                         INTERNET
                            │
                        HTTPS/WSS
                            │
                      Reverse Proxy
                            │
               ┌────────────┴────────────┐
               │                         │
          React / PWA                  API
                                         │
                                Node.js / TypeScript
                                         │
                      ┌──────────────────┼──────────────────┐
                      │                  │                  │
                 PostgreSQL          Realtime          Notifications
                                         │             APNs / FCM
                                         │
                                         │
             ┌───────────────────────────┴──────────────────────────┐
             │                                                      │
          iPhone                                                Android
             │                                                      │
      Capacitor + React                                     Capacitor + React
             │                                                      │
         WidgetKit                                            Jetpack Glance
```

---

# Architecture Philosophy

Nomi favors a **modular monolith**.

That means:

- one backend application
- clear internal modules
- one primary PostgreSQL database
- explicit domain boundaries
- simple deployment
- low operational complexity

Nomi does **not** require:

- Kubernetes
- service meshes
- dozens of microservices
- distributed systems rituals

The application should remain boring enough to operate reliably.

That is a compliment.

---

# Suggested Repository Structure

```text
nomi/
├── apps/
│   ├── client/
│   │   ├── src/
│   │   ├── public/
│   │   ├── android/
│   │   └── ios/
│   │
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
│   ├── architecture/
│   ├── api/
│   ├── deployment/
│   ├── development/
│   ├── mobile/
│   ├── operations/
│   ├── product/
│   ├── project/
│   └── security/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── docker-compose.production.yml
├── .env.example
├── AGENTS.md
├── CONTRIBUTING.md
└── README.md
```

The real repository structure may differ if the existing codebase has better conventions.

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Capacitor
- PWA
- responsive mobile-first UI

## Backend

- Node.js
- TypeScript
- REST API
- WebSocket realtime layer

## Database

- PostgreSQL

## iOS

- Capacitor
- Swift
- SwiftUI
- WidgetKit
- APNs

## Android

- Capacitor
- Kotlin
- Jetpack Glance
- FCM

## Infrastructure

- Docker
- Docker Compose
- reverse proxy
- persistent storage
- private VPS

---

# Authentication

Initial authentication supports:

- email/password
- secure session handling
- refresh-token rotation
- logout
- session revocation
- multiple devices

Future adapters may include:

- Apple Sign In
- Google
- passkeys

Security requirements:

- strong password hashing
- brute-force protection
- rate limiting
- refresh token rotation
- session revocation
- secure local token handling

---

# Privacy

Nomi is designed around private relationship data.

The product should collect only what it needs.

The following should **not** be enabled by default:

- continuous GPS tracking
- microphone access
- contact scraping
- behavioral surveillance
- invasive analytics
- automatic sensor monitoring

Sensitive sharing should always be:

1. visible
2. consensual
3. revocable

---

# Security

Minimum security expectations:

- strict input validation
- explicit authorization
- couple/tenant isolation
- secure CORS
- secure headers
- rate limiting
- upload validation
- SQL injection protection
- secure WebSocket authentication
- secret management
- request size limits
- dependency scanning
- audit logging where appropriate

Every couple-owned resource must be authorization-scoped.

Conceptually:

```sql
SELECT *
FROM memories
WHERE id = :memory_id
  AND couple_id = :authorized_couple_id;
```

Never trust a resource ID alone.

---

# Realtime

Realtime synchronization supports:

- mood changes
- activity updates
- quick interactions
- messages
- countdown changes
- calendar changes
- notification state

Realtime requirements:

- authenticated connection
- reconnect strategy
- exponential backoff
- heartbeat
- payload validation
- authorization
- duplicate event protection
- graceful shutdown

---

# Push Notifications

Provider abstraction:

```text
NotificationService
│
├── APNsProvider
│   └── iOS
│
└── FCMProvider
    └── Android
```

Notification categories:

- mood update
- status change
- affectionate interaction
- message
- countdown reminder
- event reminder
- memory activity

Users should control notification categories individually.

---

# Offline Behavior

Nomi should remain useful during temporary connection loss.

Cached data may include:

- partner status
- relationship metadata
- upcoming events
- recent memories
- widget snapshot

The UI should distinguish between:

- online
- offline
- stale
- retrying
- failed

---

# API

API base:

```text
/api/v1
```

Expected modules:

```text
/api/v1/auth
/api/v1/users
/api/v1/couples
/api/v1/pairing
/api/v1/status
/api/v1/moods
/api/v1/activities
/api/v1/events
/api/v1/countdowns
/api/v1/diary
/api/v1/memories
/api/v1/messages
/api/v1/interactions
/api/v1/notifications
/api/v1/devices
/api/v1/widgets
```

External DTOs must not expose raw persistence models.

---

# Health Checks

Production services expose:

```text
/health/live
/health/ready
```

### Liveness

Confirms the application process is running.

### Readiness

Confirms:

- configuration valid
- database reachable
- migrations satisfied
- application initialized

---

# Local Development

## Requirements

Recommended:

- Node.js LTS
- npm/pnpm according to repository lockfile
- Docker
- Docker Compose
- Git

For Android development:

- Android Studio
- Android SDK
- Java/JDK

For iOS development:

- macOS
- Xcode
- Apple development signing

---

## Clone

```bash
git clone <repository-url>
cd nomi
```

---

## Environment

```bash
cp .env.example .env
```

Configure local values.

Never commit `.env`.

---

## Install Dependencies

Example:

```bash
npm install
```

Use the package manager already selected by the repository.

---

## Start Development

Example:

```bash
npm run dev
```

---

# Docker Development

```bash
docker compose up --build
```

Expected services may include:

```text
web
api
postgres
```

---

# Production Deployment

Nomi is designed to run on a normal private Linux VPS.

## VPS Requirements

Recommended:

- Ubuntu or Debian-family distribution
- Docker Engine
- Docker Compose
- public domain
- DNS configuration
- HTTPS
- firewall
- persistent disk space

---

## Configure

```bash
git clone <repository-url>
cd nomi

cp .env.example .env
```

Set production secrets.

---

## Deploy

Example:

```bash
docker compose -f docker-compose.production.yml build

docker compose -f docker-compose.production.yml up -d
```

Check:

```bash
docker compose -f docker-compose.production.yml ps
```

Logs:

```bash
docker compose -f docker-compose.production.yml logs -f
```

---

# Production Topology

```text
Private VPS
│
├── reverse-proxy
│
├── web
│
├── api
│
└── postgres
    │
    └── persistent volume
```

The exact production topology is documented under:

```text
docs/deployment/
```

---

# Android

The Android application uses Capacitor with native Kotlin integration where necessary.

## Build

Typical flow:

```bash
npm run build
npx cap sync android
npx cap open android
```

From Android tooling:

- build debug APK
- build release APK
- build signed AAB

Signing credentials must never be committed.

See:

```text
docs/mobile/ANDROID_BUILD.md
```

---

# iOS

The iOS application uses Capacitor with native Swift integration.

Typical flow:

```bash
npm run build
npx cap sync ios
npx cap open ios
```

The final iOS application requires:

- macOS
- Xcode
- signing configuration
- appropriate Apple capabilities

Docker on a Linux VPS **does not replace Xcode for iOS builds**.

A remarkable amount of software engineering is simply discovering which corporation owns the final checkbox.

See:

```text
docs/mobile/IOS_BUILD.md
```

---

# Widget Architecture

Widgets use a shared normalized snapshot.

Conceptually:

```ts
interface CoupleWidgetSnapshot {
  generatedAt: string;

  partner: {
    displayName: string;
    avatarUrl?: string;
  };

  status?: {
    mood?: string;
    activity?: string;
    note?: string;
    updatedAt?: string;
  };

  relationship: {
    startDate: string;
    daysTogether: number;
  };

  nextEvent?: {
    id: string;
    title: string;
    occursAt: string;
  };
}
```

The actual schema should remain validated and versioned.

Widgets should not duplicate critical relationship calculations independently from the backend.

---

# Testing

Expected quality gates:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

---

## Unit Tests

Cover domain logic including:

- relationship duration
- invitation expiration
- authorization
- countdown calculations
- status behavior
- notification preference rules

---

## Integration Tests

Cover:

- PostgreSQL
- authentication
- pairing
- migrations
- realtime
- notification adapters
- authorization

---

## E2E

Critical flow:

```text
User A registers
      ↓
User B registers
      ↓
A creates invite
      ↓
B accepts
      ↓
Couple created
      ↓
A updates mood
      ↓
B receives realtime update
      ↓
B sends ❤️
      ↓
A receives notification
      ↓
A creates countdown
      ↓
B sees countdown
```

---

# CI/CD

Pull requests should validate:

- dependencies
- lint
- formatting
- TypeScript
- unit tests
- integration tests
- security checks
- client build
- server build
- Docker build
- migration validation

Android artifacts may be produced from Linux CI.

iOS build automation requires macOS infrastructure.

---

# Database

PostgreSQL is the system of record.

Requirements:

- migrations
- constraints
- indexes
- foreign keys
- transactions
- backup procedure
- restore procedure

Production migrations must be explicit and safe.

---

# Backups

Production deployments must include PostgreSQL backup support.

Operations documentation should include:

- backup command
- retention strategy
- restore command
- validation
- restore drill

A backup nobody has ever restored is mostly an optimism archive.

---

# Configuration

Example categories:

```dotenv
APP_ENV=
APP_URL=
API_URL=

DATABASE_URL=

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

APNS_KEY_ID=
APNS_TEAM_ID=
APNS_BUNDLE_ID=

FCM_PROJECT_ID=

MEDIA_STORAGE_PATH=
```

Only variables required by the implementation should be present.

Production should fail fast when required secrets are missing.

---

# Secrets

Never commit:

- `.env`
- database passwords
- JWT secrets
- Apple keys
- Firebase service credentials
- signing certificates
- Android keystores
- API credentials

Only safe placeholders belong in:

```text
.env.example
```

---

# Observability

Initial production observability should remain lightweight.

Minimum:

- structured logs
- health endpoints
- correlation IDs
- error reporting boundary
- failed-job visibility
- push delivery failure visibility

Nomi does not need an observability platform with more containers than users.

---

# Documentation

Expected documentation structure:

```text
docs/
├── architecture/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── REALTIME_ARCHITECTURE.md
│   ├── MOBILE_ARCHITECTURE.md
│   ├── WIDGET_ARCHITECTURE.md
│   └── adr/
│
├── api/
│   └── API.md
│
├── deployment/
│   ├── VPS_DEPLOYMENT.md
│   ├── RELEASE.md
│   └── ROLLBACK.md
│
├── development/
│   ├── LOCAL_DEVELOPMENT.md
│   └── TESTING.md
│
├── mobile/
│   ├── ANDROID_BUILD.md
│   ├── IOS_BUILD.md
│   ├── ANDROID_WIDGETS.md
│   └── IOS_WIDGETS.md
│
├── operations/
│   ├── BACKUP_RESTORE.md
│   ├── MONITORING.md
│   └── INCIDENT_RESPONSE.md
│
├── product/
│   ├── PRODUCT_REQUIREMENTS.md
│   └── FEATURE_MATRIX.md
│
├── project/
│   ├── IMPLEMENTATION_PLAN.md
│   └── IMPLEMENTATION_STATUS.md
│
└── security/
    ├── SECURITY_MODEL.md
    └── SECRETS.md
```

---

# AgenticOS

Nomi is intended to be developed and maintained using an AgenticOS orchestration layer.

The orchestration system should:

1. inspect the repository
2. read `AGENTS.md`
3. understand architecture
4. select relevant agents
5. load appropriate skills
6. use the reference library
7. create dependency-aware work plans
8. implement
9. review
10. test
11. document
12. run security checks
13. record lessons
14. update reusable experience
15. award XP according to AgenticOS rules

The orchestration layer must not bypass engineering quality gates merely because implementation was generated autonomously.

---

# Agent Workflow

```text
PLAN
  ↓
IMPLEMENT
  ↓
SELF REVIEW
  ↓
SPECIALIST REVIEW
  ↓
TEST
  ↓
SECURITY CHECK
  ↓
DOCUMENT
  ↓
ACCEPTANCE GATE
  ↓
COMPLETE
```

---

# Project Status

Project progress should be maintained in:

```text
docs/project/IMPLEMENTATION_STATUS.md
```

Suggested phase structure:

```text
Phase 0   Discovery
Phase 1   Architecture
Phase 2   Foundation
Phase 3   Authentication
Phase 4   Pairing
Phase 5   Dashboard
Phase 6   Mood & Status
Phase 7   Calendar & Countdowns
Phase 8   Diary & Memories
Phase 9   Messaging & Interactions
Phase 10  Realtime
Phase 11  Push Notifications
Phase 12  Mobile Integration
Phase 13  iOS Widgets
Phase 14  Android Widgets
Phase 15  Offline Support
Phase 16  Security
Phase 17  Testing
Phase 18  Docker/VPS Production
Phase 19  Release
```

---

# Future Roadmap

Potential future features:

- Apple Sign In
- Google authentication
- passkeys
- Apple Watch
- Wear OS
- voice messages
- video messages
- richer reactions
- shared goals
- couple challenges
- private location sharing
- optional battery sharing
- smart reminders
- relationship insights
- end-to-end encryption using established protocols
- object storage
- multi-couple SaaS
- subscription billing
- public App Store release
- Google Play release

Future features should not compromise the simplicity of the initial product.

---

# Non-Goals for V1

The first production release does **not** require:

- public social networking
- AI relationship therapy
- continuous GPS tracking
- voice/video calling
- advanced analytics
- marketplace
- payment system
- microservices
- Kubernetes
- custom cryptographic protocols

---

# Production Definition of Done

Nomi is production ready when:

- [ ] client builds successfully
- [ ] server builds successfully
- [ ] PostgreSQL migrations pass
- [ ] lint passes
- [ ] TypeScript passes
- [ ] unit tests pass
- [ ] integration tests pass
- [ ] E2E tests pass
- [ ] Docker production images build
- [ ] health checks work
- [ ] HTTPS deployment documented
- [ ] backups documented and tested
- [ ] no committed secrets
- [ ] authentication reviewed
- [ ] authorization reviewed
- [ ] cross-couple isolation tested
- [ ] WebSocket authorization tested
- [ ] Android application builds
- [ ] Android widget works
- [ ] iOS project opens successfully in Xcode
- [ ] WidgetKit extension builds
- [ ] push notification setup documented
- [ ] release process documented
- [ ] rollback procedure documented
- [ ] unresolved production blockers recorded

---

# Brand

## Name

**Nomi**

## Tagline

**Closer, every day.**

## Brand Personality

- warm
- intimate
- modern
- quiet
- trustworthy
- premium
- human

---

# Assets

Recommended:

```text
docs/assets/
├── nomi-logo.png
├── nomi-icon.png
├── nomi-banner.png
├── screenshots/
└── brand/
```

The repository should store optimized production variants rather than oversized design originals.

---

# License

This project is currently intended to remain **private and proprietary**.

```text
Copyright © Nomi.
All rights reserved.
```

Do not redistribute source code, private assets, credentials, or proprietary documentation without authorization.

---

# Final Note

Nomi is intentionally built around one simple idea:

> Technology should help two people feel closer without demanding more attention than the relationship itself.

Keep the product small, private, reliable, and meaningful.

---

<p align="center">
  <strong>Nomi</strong>
  <br />
  Closer, every day. ❤️
</p>
