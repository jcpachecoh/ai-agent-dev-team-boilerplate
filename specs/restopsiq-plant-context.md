# Spec: Plant KDS Frontend Architecture

## Overview

This specification defines the frontend architecture for the RestOpsIQ Plant KDS system used in industrial production environments.

The application is designed as an offline-first industrial SPA packaged as a native Android/iOS application using Capacitor.

The KDS is optimized for fixed tablets installed in production stations and supervisor dashboards running in real-time across the plant.

---

# Architectural Decision

## Approved Stack

Vite + React + Capacitor

Next.js is explicitly excluded from this architecture.

---

## Decision Rationale

The KDS does not require:

- SSR
- SSG
- App Router
- Node.js runtime
- Edge rendering
- SEO optimization

Using Next.js would introduce unnecessary runtime overhead and increase bundle size significantly for industrial tablets.

Vite produces a lightweight static bundle suitable for Capacitor packaging and offline-first execution.

---

# Architecture Goals

- Ultra-lightweight runtime
- Offline-first operation
- Native Android tablet integration
- Real-time operational updates
- Persistent station identity
- Industrial-grade reliability
- Fast cold boot
- Minimal memory usage
- Touch-first usability

---

# Technology Stack

| Technology                      | Purpose                        |
| ------------------------------- | ------------------------------ |
| Vite 5                          | Static SPA bundling            |
| React 18                        | UI rendering                   |
| TypeScript                      | Type safety                    |
| Zustand                         | Global state management        |
| vite-plugin-pwa + Workbox       | Offline support                |
| Capacitor 6                     | Native wrapper                 |
| @capacitor/camera               | Native camera integration      |
| @capacitor-community/keep-awake | Wake lock support              |
| @capacitor/preferences          | Persistent local configuration |
| Capgo                           | Live updates                   |
| Socket.io Client                | Real-time synchronization      |
| SCSS                            | Industrial design preset       |

---

# Frontend Architecture

## Monorepo Structure

```txt
apps/plant/
├── src/
│   ├── screens/
│   ├── supervisor/
│   ├── stores/
│   ├── hooks/
│   ├── components/
│   ├── services/
│   └── main.tsx
├── android/
├── ios/
├── vite.config.ts
├── capacitor.config.ts
└── scss.config.ts
```

---

# Screen Architecture

## Operator Screens

### Login.tsx

Industrial PIN authentication screen.

#### Requirements

- Numeric keypad minimum 88x72px
- Gloves-compatible interaction
- Station-aware authentication
- Fullscreen dark mode

---

### PhasePending.tsx

Waiting state screen while previous production phase completes.

#### Requirements

- Real-time phase synchronization
- Passive monitoring mode
- No operational ambiguity

---

### PhaseActive.tsx

Primary operational execution screen.

#### Requirements

- Real-time timer
- Offline-safe timer persistence
- Pause workflow
- Incident workflow
- Completion workflow

---

### PhaseIncident.tsx

Incident reporting overlay.

#### Requirements

- Native camera support
- Offline queue persistence
- Maximum 4 interactions to submit

---

### PhaseComplete.tsx

Phase completion confirmation screen.

#### Requirements

- Industrial numeric keypad
- Decimal quantity support
- Confirmation workflow

---

# Supervisor Screens

## Dashboard.tsx

Real-time operational plant overview.

### Requirements

- WebSocket synchronization
- Multi-station monitoring
- Alarm visualization
- Live operational states

---

## Orders.tsx

Production order management.

### Requirements

- Active OP listing
- Phase progress tracking
- Operational filtering

---

## CreateOrder.tsx

Production order creation workflow.

### Requirements

- Auto-generated phases
- Validation rules
- Operational sequencing

---

# State Management

## Zustand Stores

---

## timer.store.ts

### Responsibilities

- Local timer state
- Offline-safe interval handling
- Elapsed time persistence
- Recovery after reconnect

### Constraints

- Must continue functioning without internet
- Cannot depend on WebSocket state
- Drift tolerance under 1 second/hour

---

## session.store.ts

### Responsibilities

- Active operator session
- Station identity persistence
- Authentication state

### Constraints

- stationId must persist between app restarts
- Session recovery after unexpected shutdown

---

## connectivity.store.ts

### Responsibilities

- Network connectivity detection
- Sync queue status
- Reconnection handling

### Requirements

- Ping interval every 10 seconds
- Automatic retry strategy
- Offline queue monitoring

---

# Real-Time Architecture

## usePlantSocket.ts

Centralized WebSocket management hook.

---

## Events

### phase:status_changed

Synchronizes operational phase states.

---

### alarm:triggered

Triggers operational alarms in supervisor dashboard.

---

### incident:created

Broadcasts incident reports.

---

### operator:connected

Tracks active operator sessions.

---

# Offline-First Requirements

## Core Principle

The application must remain operational during WiFi outages.

---

## Offline Capabilities

| Feature             | Offline Support |
| ------------------- | --------------- |
| Timer               | Required        |
| Incident Reporting  | Required        |
| Session Persistence | Required        |
| Station Identity    | Required        |
| Alarm Queue         | Required        |

---

## Queue Synchronization

Pending operations must:

- Persist locally
- Retry automatically
- Sync after reconnection
- Prevent duplicate submissions

---

# Native Android Requirements

## Capacitor Requirements

### Kiosk Mode Support

The tablet must support Android Lock Task Mode.

#### Goal

Prevent operators from leaving the application accidentally.

---

## Wake Lock

### Requirements

- Screen must remain active during active sessions
- Wake lock released after logout
- Recovery after application resume

---

## Native Camera

### Requirements

- Incident photos captured using native camera
- Offline-safe upload queue
- Image compression before sync

---

# Station Identity

## stationId Persistence

Each tablet permanently belongs to a production station.

---

## Initialization Methods

### Method 1 — Install-Time Configuration

```bash
npx cap run android -- --stationId=EST-02
```

---

### Method 2 — QR Configuration

Supervisor scans station QR during provisioning.

---

## Persistence Rules

- stationId stored locally
- stationId survives app restarts
- stationId survives connectivity loss

---

# Performance Requirements

## Startup

| Requirement          | Target      |
| -------------------- | ----------- |
| Cold boot            | < 3 seconds |
| Screen transition    | < 150ms     |
| Timer update latency | < 100ms     |

---

## Bundle Size

| Application          | Target                 |
| -------------------- | ---------------------- |
| Operator KDS         | ~120KB gzipped         |
| Supervisor Dashboard | Minimized static build |

---

# Reliability Requirements

## Operational Continuity

The system must continue functioning during:

- WiFi interruptions
- Backend outages
- WebSocket disconnects
- Tablet sleep recovery

---

## Recovery Requirements

After reconnect:

- Pending incidents sync automatically
- Timers reconcile with backend
- Operational states resynchronize

---

# Security Requirements

## Authentication

- PIN-based authentication
- Session expiration support
- Local secure persistence

---

## Device Security

- Kiosk mode enforcement
- Restricted navigation
- Supervisor-only configuration access

---

# Accessibility Requirements

## Operator Accessibility

| Requirement          | Value   |
| -------------------- | ------- |
| Minimum body font    | 18px    |
| Minimum touch target | 48x48px |
| Keypad target        | 88x72px |

---

## Environmental Constraints

The interface must remain usable under:

- Low light
- Wet hands
- Gloves
- Greasy environments
- 60cm viewing distance

---

# Acceptance Criteria

- [ ] apps/plant runs successfully using pnpm turbo dev
- [ ] Production builds generate installable Android APKs
- [ ] Tablets boot directly into station login screen
- [ ] Wake lock prevents screen sleep during active sessions
- [ ] Offline timer continues without connectivity
- [ ] Incident reports persist offline
- [ ] Offline queue synchronizes automatically after reconnect
- [ ] WebSocket reconnection occurs automatically
- [ ] stationId persists permanently on the device
- [ ] Supervisor dashboard updates in real time without reload

---

# Testing Strategy

## Frontend Validation

- Offline behavior testing
- Touch interaction testing
- Tablet usability validation
- Low-light visibility validation
- Reconnection flow testing

---

## Native Validation

- Capacitor build validation
- Wake lock validation
- Camera integration testing
- Android kiosk mode testing

---

## Real-Time Validation

- WebSocket reconnect testing
- Timer synchronization testing
- Queue reconciliation testing

---

# Out of Scope

- Next.js support
- Server-side rendering
- SEO optimization
- Browser-first architecture
- Consumer mobile responsiveness
- Desktop-native Electron builds
- Marketing site integration
