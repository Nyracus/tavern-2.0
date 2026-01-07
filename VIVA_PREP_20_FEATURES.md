# Tavern Viva Prep — 20 Features (SRS-aligned) + “Where in Code” + Workflows

This document is written directly from the **Features List** in `SRS.md` (items 1–20).  
Goal: you can explain the whole project in a viva by walking through these features in order, showing the **UI → API → Controller/Service → DB** flow.

---

## How to navigate the codebase (30-second overview)

### Frontend (React + Vite)
- **Routes**: `tavern-frontend/src/main.tsx`
- **Auth + token storage**: `tavern-frontend/src/context/AuthContext.tsx`
- **API wrapper**: `tavern-frontend/src/lib/api.ts` (adds `Authorization: Bearer <token>`)
- **Notifications polling**: `tavern-frontend/src/lib/notifications.tsx`, UI: `tavern-frontend/src/components/NotificationDropdown.tsx`
- **Role dashboards & pages**: `tavern-frontend/src/pages/*`

### Backend (Node + Express + MongoDB/Mongoose)
- **Route registration**: `tavern-backend/src/routes/index.ts` under `/api`
- **RBAC middleware**: `tavern-backend/src/middleware/auth.middleware.ts` (`verifyToken`, `authorizeRole`)
- **Main domain routes**:
  - Quests: `tavern-backend/src/routes/quest.routes.ts`
  - Adventurer profile: `tavern-backend/src/routes/adventurerProfile.routes.ts`
  - NPC org: `tavern-backend/src/routes/npcOrganization.routes.ts`
  - Chat: `tavern-backend/src/routes/chat.routes.ts`
  - Conflicts: `tavern-backend/src/routes/conflict.routes.ts`
  - Transactions: `tavern-backend/src/routes/transaction.routes.ts`
  - Admin anomalies/cache: `tavern-backend/src/routes/admin.routes.ts`
  - Leaderboard: `tavern-backend/src/routes/leaderboard.routes.ts`
  - Notifications: `tavern-backend/src/routes/notification.routes.ts`
  - Workload: `tavern-backend/src/routes/workload.routes.ts`
- **Key models**: `tavern-backend/src/models/*.ts` (Quest/User/Profile/Org/Conflict/Transaction/Notification/ChatMessage/Anomaly)

---

## Feature 1 — Adventurer Profile & Skill Management

### What it is
Adventurers create a profile (class, title, summary, stats) and manage skills.

### Workflow (UI → API → DB)
- **UI**:
  - On first login (needs onboarding): `tavern-frontend/src/pages/Onboarding.tsx`
  - Create profile: `tavern-frontend/src/pages/CreateAdventurerProfile.tsx`
  - Edit profile + distribute stat points + upload logo: `tavern-frontend/src/pages/EditAdventurerProfile.tsx`
  - Dashboard summary: `tavern-frontend/src/pages/Dashboard.tsx`
- **API endpoints** (backend):
  - GET profile: `GET /api/adventurers/me` → `tavern-backend/src/routes/adventurerProfile.routes.ts`
  - Create: `POST /api/adventurers/me`
  - Update: `PATCH /api/adventurers/me`
  - Skills: `POST/PATCH/DELETE /api/adventurers/me/skills`
  - Stat allocation: `POST /api/adventurers/me/allocate-stat`
  - Logo upload: `POST /api/adventurers/me/logo` (multipart)
- **Controllers/Services**:
  - `tavern-backend/src/controllers/adventurerProfile.controller.ts`
  - `tavern-backend/src/services/adventurerProfile.service.ts`
  - Validation: `tavern-backend/src/schemas/adventurerProfile.schema.ts`
- **DB models**:
  - Profile: `tavern-backend/src/models/adventurerProfile.model.ts`
  - User (role + gold): `tavern-backend/src/models/user.model.ts`

### Key logic you can explain
- **Minimum stats** enforced at both layers:
  - Frontend starts at 10 and validates (Create/Edit pages).
  - Backend schema enforces `min(10)` for each attribute.
- **Rank (not level)** is derived from XP:
  - XP award and rank-up logic: `addXP()` in `tavern-backend/src/controllers/adventurerProfile.controller.ts`
- **Logo uploads** go to Supabase storage:
  - Upload & URL generation: `tavern-backend/src/services/storage.service.ts` (`uploadLogo`)

### Viva demo script
1. Register as ADVENTURER → login → redirected to onboarding.
2. Create profile (shows “8 points remaining”, cannot submit until points used).
3. Open dashboard → see profile summary + rank.
4. Go to Edit Profile → adjust stats → save → upload logo → refresh dashboard.

---

## Feature 2 — NPC Organization Profile & Trust Overview

### What it is
NPCs maintain an organization profile and see trust metrics (quests posted, gold spent, completion rate).

### Workflow
- **UI**:
  - Organization edit/create manager: `tavern-frontend/src/pages/_NpcOrganizationManager.tsx` (exported by `tavern-frontend/src/pages/NPCOrganization.tsx`)
  - Dashboard org display: `tavern-frontend/src/pages/Dashboard.tsx`
- **API endpoints**:
  - `GET /api/npc-organizations/me`
  - `POST /api/npc-organizations/me`
  - `PATCH /api/npc-organizations/me`
  - `GET /api/npc-organizations/me/trust`
  - `POST /api/npc-organizations/me/logo`
- **Controllers/Services**:
  - Controller: `tavern-backend/src/controllers/npcOrganization.controller.ts`
  - Service: `tavern-backend/src/services/npcOrganization.service.ts`
- **DB model**:
  - `tavern-backend/src/models/npcOrganization.model.ts`
  - `tavern-backend/src/models/quest.model.ts` (trust overview calculates from quests)

### Key logic
- **Trust overview metrics** are computed from quests:
  - `totalGoldSpent`: sum of `rewardGold` where quest status is `Paid`
  - `completionRate`: completed (Completed+Paid) / finished (Completed+Paid+Cancelled)
  - Code: `getTrustOverview()` in `tavern-backend/src/services/npcOrganization.service.ts`
- **Verification** ties to user email verification:
  - `User.emailVerified` in `tavern-backend/src/models/user.model.ts`
  - Organization may auto-update to `verified=true` when email verified.
- **Logo upload** uses `storageService.uploadLogo()` (Supabase).

### Viva demo
1. Login as NPC → go to Organization page → create.
2. Show trust overview page: quests posted, gold spent, completion rate.
3. Upload logo → dashboard shows logo.

---

## Feature 3 — Quest Creation & Management (CRUD + Status)

### What it is
NPC creates quests; can edit/delete; quest moves through statuses.

### Workflow
- **UI**:
  - NPC quest CRUD UI: `tavern-frontend/src/pages/NPCQuestBoard.tsx`
- **API endpoints**:
  - Create: `POST /api/quests`
  - List NPC’s quests: `GET /api/quests/mine`
  - Update: `PATCH /api/quests/:questId`
  - Delete: `DELETE /api/quests/:questId`
- **Backend**:
  - Routes: `tavern-backend/src/routes/quest.routes.ts`
  - Controller: `tavern-backend/src/controllers/quest.controller.ts` (`createQuest`, `listMyPostedQuests`, `updateQuest`, `deleteQuest`)
- **DB model**:
  - `tavern-backend/src/models/quest.model.ts`

### Key logic
- Status enum is in `QuestStatus`: Open → Applied → Accepted → Completed → Paid (+ Cancelled)
- RBAC: only NPC can create/update/delete.

### Viva demo
1. NPC posts a quest.
2. Edit quest title/description/reward.
3. Delete quest (show confirmation).

---

## Feature 4 — Quest Browsing, Filtering & Search

### What it is
Adventurers browse quests and filter/search (including quest poster’s name).

### Workflow
- **UI**:
  - Quest board: `tavern-frontend/src/pages/AdventurerQuestBoard.tsx`
- **API**:
  - `GET /api/quests?status=Open&search=...&difficulty=...&minReward=...&maxReward=...`
- **Backend**:
  - `listQuests()` in `tavern-backend/src/controllers/quest.controller.ts`
  - Populates NPC: `.populate("npcId", "username displayName")`
  - Then applies extra filtering so `search` can match NPC name/username/displayName too.

### Key logic
- Query-level filter matches title/description.
- Post-population filter extends search to NPC identity (poster name).

### Viva demo
1. Show search bar in quest board.
2. Search by quest title.
3. Search by NPC display name / username (poster).

---

## Feature 5 — Quest Application & Assignment

### What it is
Adventurer applies to quests; NPC accepts/rejects; deadline set on acceptance.

### Workflow
- **UI (Adventurer)**:
  - Apply from: `tavern-frontend/src/pages/AdventurerQuestBoard.tsx`
  - View application status: `tavern-frontend/src/pages/AdventurerApplications.tsx`
- **UI (NPC)**:
  - Review applicants: `tavern-frontend/src/pages/NPCApplications.tsx`
- **API**:
  - Apply: `POST /api/quests/:questId/apply`
  - List my applications: `GET /api/quests/applications/mine`
  - Decide: `POST /api/quests/:questId/applications/:applicationId/decision` with `{ decision, deadline? }`
- **Backend**:
  - `applyToQuest()` / `listMyApplications()` / `decideApplication()` in `tavern-backend/src/controllers/quest.controller.ts`
  - Notifications triggered: `tavern-backend/src/services/notification.service.ts`

### Key logic
- Applying pushes `Quest.applications[]` and sets quest status `Applied`.
- NPC acceptance sets:
  - `quest.adventurerId`
  - `quest.status = "Accepted"`
  - `quest.deadline = ...`
  - stores `originalDescription` and `originalDeadline` for conflict detection.

---

## Feature 6 — Quest Progress & Work Submission (with Revisions)

### What it is
Adventurer submits completion; NPC can approve (pay) or reject (revision loop).

### Workflow
- **UI**:
  - Submit completion + optional PDF: `tavern-frontend/src/pages/AdventurerApplications.tsx`
  - NPC review: `tavern-frontend/src/pages/NPCCompletions.tsx`
- **API**:
  - Upload report: `POST /api/quests/upload-report` (PDF to Supabase, returns URL)
  - Submit completion: `POST /api/quests/:questId/submit-completion` with `{ reportUrl? }`
  - Reject: `POST /api/quests/:questId/reject-completion`
  - Approve+pay: `POST /api/quests/:questId/pay`
- **Backend**:
  - `uploadQuestReport` in `tavern-backend/src/controllers/storage.controller.ts`
  - `submitCompletion`, `rejectCompletion`, `payQuest` in `tavern-backend/src/controllers/quest.controller.ts`
  - Storage: `tavern-backend/src/services/storage.service.ts` (`quest-reports` bucket)

### Key logic
- Deadline enforcement: submit blocked if `now > quest.deadline`.
- Revisions loop: NPC rejection resets status back to `Accepted` so adventurer can re-submit.

---

## Feature 7 — Quest-Specific Chat Channel

### What it is
Each quest has a private chat between NPC and Adventurer; GM joins only if conflict exists.

### Workflow
- **UI**:
  - Chat modal: `tavern-frontend/src/components/QuestChat.tsx` (polls every 3s)
  - Chat lists:
    - Adventurer: `tavern-frontend/src/pages/AdventurerChats.tsx`
    - NPC: `tavern-frontend/src/pages/NPCChats.tsx`
    - GM: `tavern-frontend/src/pages/GuildmasterChats.tsx`
- **API**:
  - Get messages: `GET /api/quests/:questId/messages`
  - Send message: `POST /api/quests/:questId/messages`
  - Chat lists: `GET /api/adventurer/chats`, `GET /api/npc/chats`, `GET /api/admin/chats`
- **Backend**:
  - Routes: `tavern-backend/src/routes/chat.routes.ts`
  - Controller: `tavern-backend/src/controllers/chat.controller.ts`
  - Model: `tavern-backend/src/models/chatMessage.model.ts`

### Key logic
- Access control:
  - NPC can chat if `quest.npcId == userId`
  - Adventurer if `quest.adventurerId == userId`
  - Guildmaster only if `quest.hasConflict === true`
- Sends notifications on new chat message: `notificationService.notifyChatMessage()`

---

## Feature 8 — Dispute Escalation & Resolution Tools

### What it is
Either party can raise conflicts; Guild Master resolves.

### Workflow
- **UI**:
  - Adventurer raise conflict: `tavern-frontend/src/pages/AdventurerApplications.tsx`
  - NPC raise deadline conflict: `tavern-frontend/src/pages/NPCQuestBoard.tsx`
  - GM resolves: `tavern-frontend/src/pages/AdminConflicts.tsx`
- **API**:
  - Adventurer: `POST /api/quests/:questId/conflicts/raise`
  - NPC: `POST /api/quests/:questId/conflicts/raise-deadline`
  - View by quest: `GET /api/quests/:questId/conflicts`
  - Admin list: `GET /api/admin/conflicts`
  - Resolve: `POST /api/admin/conflicts/:conflictId/resolve`
- **Backend**:
  - Routes: `tavern-backend/src/routes/conflict.routes.ts`
  - Controller: `tavern-backend/src/controllers/conflict.controller.ts`
  - Service: `tavern-backend/src/services/conflict.service.ts`
  - Model: `tavern-backend/src/models/conflict.model.ts`

### Key logic
- Adventurer conflicts require **50% of quest reward escrowed** from adventurer’s gold.
- Quest chat becomes visible to GM only when conflict exists (`quest.hasConflict`).

---

## Feature 9 — Guild Escrow Creation & Management (Bounty Vault)

### What it is (SRS)
Escrow deposit at quest posting and release/refund later.

### What’s implemented right now
- **Conflict escrow** is implemented (adventurer deposits escrow to raise conflict).
- A general ledger exists with escrow-style transaction types.
- Quest posting currently does **not** escrow upfront (see comment in `createQuest()`).

### Where in code
- Escrow accounting primitives:
  - Transaction types: `tavern-backend/src/models/transaction.model.ts`
  - Balance calculator: `getQuestEscrowBalance()` in `tavern-backend/src/services/transaction.service.ts`
- Conflict escrow deposit:
  - `raiseConflictByAdventurer()` in `tavern-backend/src/controllers/conflict.controller.ts`

### How to explain in viva
“We designed escrow as ledger events; right now the conflict system uses escrow, and the quest-post escrow path is a straightforward extension using the same transaction model.”

---

## Feature 10 — Payment Release, Refund & Ledger View

### What it is
NPC pays adventurer on completion; ledger shows transactions; GM can inspect all.

### Workflow
- **UI**:
  - NPC approves payment: `tavern-frontend/src/pages/NPCCompletions.tsx`
  - GM ledger: `tavern-frontend/src/pages/AdminTransactions.tsx`
- **API**:
  - Pay quest: `POST /api/quests/:questId/pay`
  - Quest transactions: `GET /api/quests/:questId/transactions`
  - My transactions: `GET /api/transactions/me`
  - GM ledger: `GET /api/admin/transactions`
- **Backend**:
  - Payment logic: `payQuest()` in `tavern-backend/src/controllers/quest.controller.ts`
  - Ledger queries: `tavern-backend/src/controllers/transaction.controller.ts` + `tavern-backend/src/services/transaction.service.ts`

### Key logic
- `payQuest()`:
  - sets quest status to `Paid`
  - increments adventurer `User.gold`
  - writes transaction record (`ESCROW_RELEASE` used as “payment” type for consistency)
  - sends notification + email
  - awards XP → rank progression

---

## Feature 11 — Scroll of Deeds (Certificate) Generation & Verification

### What it is (SRS)
Generate a verifiable certificate after completion.

### What’s implemented right now
- A “completion report” flow exists (PDF upload + stored URL), which is **close to a certificate artifact**:
  - Upload PDF to Supabase: `POST /api/quests/upload-report`
  - Link stored: `Quest.completionReportUrl`
  - UI shows “View PDF Report” in NPC completion review.

### Where you would implement full “verifiable scroll”
- Add fields on `Quest` (or new model) for:
  - `certificateId`, `certificateHash`, `issuedAt`, `verificationUrl`
- Create controller endpoints:
  - `POST /quests/:id/certificate/issue` (called on payment)
  - `GET /certificates/:certificateId/verify` (public)

---

## Feature 12 — Adventurer Dashboard (Quest & Progress View)

### What it is
Role-based dashboard; shows stats, workload warnings, quick navigation.

### Where in code
- Dashboard UI: `tavern-frontend/src/pages/Dashboard.tsx`
- Workload hook: `tavern-frontend/src/hooks/useWorkload.ts` (calls workload endpoint)
- Quick quest view: `tavern-frontend/src/components/QuestQuickView.tsx`
- Stats widget: `tavern-frontend/src/components/AdventurerStats.tsx`

### Backend support
- Workload endpoint: `GET /api/adventurers/me/workload` → `tavern-backend/src/controllers/workload.controller.ts`

---

## Feature 13 — NPC Dashboard (Quest & Spending View)

### Where in code
- NPC console links and org summary inside: `tavern-frontend/src/pages/Dashboard.tsx`
- Quest management: `tavern-frontend/src/pages/NPCQuestBoard.tsx`
- Applications review: `tavern-frontend/src/pages/NPCApplications.tsx`
- Completion review/payment: `tavern-frontend/src/pages/NPCCompletions.tsx`
- Organization/trust: `tavern-frontend/src/pages/_NpcOrganizationManager.tsx`

---

## Feature 14 — Guild Master Dashboard (Global Control Panel)

### Where in code
- GM links on dashboard: `tavern-frontend/src/pages/Dashboard.tsx`
- Anomalies: `tavern-frontend/src/pages/AdminAnomalies.tsx`
- Conflicts: `tavern-frontend/src/pages/AdminConflicts.tsx`
- Ledger: `tavern-frontend/src/pages/AdminTransactions.tsx`
- User deletion: `tavern-frontend/src/pages/AdminUsers.tsx`
- All chats: `tavern-frontend/src/pages/GuildmasterChats.tsx`

### Backend
- Admin routes: `tavern-backend/src/routes/admin.routes.ts`
- Anomaly scan/list/update: `tavern-backend/src/controllers/admin.controller.ts` + `tavern-backend/src/services/anomaly.service.ts`

---

## Feature 15 — XP, Rank & Badge Progression System

### What’s implemented
- XP + Rank progression is implemented:
  - XP award on payment: `payQuest()` in `tavern-backend/src/controllers/quest.controller.ts`
  - Rank calculation + stat point grants: `addXP()` in `tavern-backend/src/controllers/adventurerProfile.controller.ts`
- Badge awarding is **not present** (no badge model / logic found).

### Where badges would go
- Add `BadgeModel` + attach badges to `AdventurerProfile`
- Update `payQuest()` (after XP award) to check milestones and award badges.

---

## Feature 16 — Adaptive Quest Recommendation Engine

### What it is
Recommended quests for an adventurer based on rank + class keywords.

### Where in code
- UI:
  - `tavern-frontend/src/pages/AdventurerQuestBoard.tsx` loads:
    - `GET /quests` and `GET /quests/recommended`
- Backend:
  - Route: `GET /api/quests/recommended` in `tavern-backend/src/routes/quest.routes.ts`
  - Logic: `getRecommendedQuests()` in `tavern-backend/src/controllers/quest.controller.ts`

### Key logic
- Rank-to-difficulty mapping (`F` → Easy … `SSS` → Epic)
- Class keyword bonus (scans title/description for class-themed keywords)
- Returns sorted list by `recommendationScore` + rank metadata.

---

## Feature 17 — Anomaly / Fraud Detection Engine

### What it is
Heuristic detectors create anomaly records; GM can scan and manage statuses.

### Where in code
- Backend:
  - Model: `tavern-backend/src/models/anomaly.model.ts`
  - Service: `tavern-backend/src/services/anomaly.service.ts`
    - NPC inactivity (no quests in 7 days)
    - Adventurer overworked (>=5 active quests)
    - Deadline passed anomalies (Accepted quests past deadline)
  - Admin controller: `tavern-backend/src/controllers/admin.controller.ts`
  - Routes: `tavern-backend/src/routes/admin.routes.ts`
- Frontend:
  - `tavern-frontend/src/pages/AdminAnomalies.tsx`

---

## Feature 18 — Burnout / Workload Detection & Warnings

### What it is
Prevent adventurers from taking too many active quests; show warnings.

### Where in code
- Backend:
  - Workload endpoint: `GET /api/adventurers/me/workload` in `tavern-backend/src/routes/workload.routes.ts`
  - Logic: `tavern-backend/src/controllers/workload.controller.ts`
  - Enforcement middleware: `enforceWorkloadLimit` used on `POST /quests/:id/apply`
- Frontend:
  - Hook: `tavern-frontend/src/hooks/useWorkload.ts`
  - Display: `tavern-frontend/src/pages/Dashboard.tsx`

---

## Feature 19 — Global Leaderboards (Adventurers & NPCs)

### What’s implemented
- Adventurer leaderboard by XP/rank is implemented:
  - Backend: `GET /api/leaderboard/adventurers` → `tavern-backend/src/controllers/leaderboard.controller.ts`
  - Frontend: `tavern-frontend/src/pages/AdventurerLeaderboard.tsx`
- NPC leaderboards are not present as a dedicated endpoint/page (but trust overview exists).

---

## Feature 20 — Notification & Alert System

### What it is
In-app notifications (and optional email) for key events: applications, acceptance, completion submitted, payment, chat.

### Where in code
- Backend:
  - Model: `tavern-backend/src/models/notification.model.ts`
  - Service: `tavern-backend/src/services/notification.service.ts`
  - Controller/routes: `tavern-backend/src/controllers/notification.controller.ts`, `tavern-backend/src/routes/notification.routes.ts`
  - Email sending integration: `tavern-backend/src/services/email.service.ts` (called by notification service)
- Frontend:
  - Provider + polling: `tavern-frontend/src/lib/notifications.tsx`
  - UI dropdown: `tavern-frontend/src/components/NotificationDropdown.tsx`
  - Embedded in dashboard header: `tavern-frontend/src/pages/Dashboard.tsx`

### Key logic
- Provider polls every ~15 seconds, updates unread count, marks read via API.

---

## Quick “end-to-end story” for viva (recommended order)
1. Auth → onboarding gate → profile creation (Feature 1)
2. NPC org + trust (Feature 2)
3. NPC posts quest (Feature 3)
4. Adventurer browses/searches + recommended (Features 4 + 16)
5. Apply + NPC acceptance + deadline (Feature 5)
6. Chat in quest (Feature 7)
7. Submit completion + PDF report (Feature 6)
8. NPC pays → XP/rank updates + notification (Features 10 + 15 + 20)
9. If dispute: raise conflict → GM resolves + chat visibility (Feature 8)
10. GM scans anomalies + sees ledger (Features 17 + 10)
11. Workload warnings (Feature 18)
12. Leaderboard (Feature 19)



