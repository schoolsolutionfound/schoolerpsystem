# Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Mobile Framework | Expo SDK 54 | Cross-platform (iOS, Android, Web) |
| UI Layer | React Native 0.81 + React 19 | Component rendering |
| Language | TypeScript | Type safety |
| Routing | Expo Router (file-based) | Screens & navigation |
| Backend API | Cloud Run (Node.js/Fastify) | REST API — all business logic |
| Primary DB | Cloud SQL (PostgreSQL) | Relational data (students, classes, grades, fees, attendance) |
| Real-time DB | Firestore | Live updates, notifications, chat, presence |
| Cache | Redis (Upstash) | Session cache, fee lookups, timetable — 100x faster reads |
| Auth | Firebase Auth (email/phone/OAuth) | Authentication |
| File Storage | Cloud Storage | Photos, report cards, documents |
| Search | Firestore indexes (or Algolia if needed) | Student/teacher/class search |
| Client State | Zustand + persist (AsyncStorage) | Session, preferences, offline data |
| Server State / Cache | TanStack React Query | API caching, background refetch, offline queue |
| Push Notifications | expo-notifications + FCM | Alerts to mobile |
| Error Monitoring | Sentry | Crash & error reporting |
| API Client | axios / fetch | Cloud Run communication |
| Admin Hosting | Firebase Hosting + Cloud CDN | Web admin panel with global edge caching |
| i18n | Custom i18n (or i18next) | Multi-language support |
| CI/CD | EAS Build + Cloud Build | Mobile & backend deployment |
