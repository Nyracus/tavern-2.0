# Tavern: A Quest Management Platform - SRS

**Prepared by:**
- Saiful Islam Tuhin - 21201547
- Mohammad Taysir Chowdhury - 23101089
- Abdullah Al Sohan - 22299536
- Mustahid Ahmed Sazid - 22299493

## 1. Introduction

### 1.1 Type of Project
Tavern is a web-based job management system built using the MERN stack (MongoDB, Express.js, React.js, Node.js), re-imagined in a fantasy RPG guild setting.

It connects employers and students in short-term, skill-based tasks (quests) where:
- Employers act as NPC Quest Givers,
- Students act as Adventurers,
- The admin functions as the Guild Master overseeing all operations.

The project follows the MVC architecture and Agile sprint development with version control via GitHub and deployment on Vercel (frontend) and Render (backend).

### 1.2 Purpose
The purpose of this project is to gamify the traditional micro-internship process, making skill development and task completion more engaging.

GuildForge provides:
- A safe and motivating environment where students can gain practical work experience.
- A unified system for employers to post, monitor, and reward short-term projects.
- A transparent reward, ranking, and certification structure managed by the Guild Master.

**Core goals:**
1. Simplify the quest workflow (quest posting → completion → payment).
2. Increase engagement through XP, ranks, badges, and leaderboards.
3. Detect anomalies or fraud (e.g., repetitive suspicious transactions).
4. Provide verified certificates ("Scrolls of Deeds") for completed tasks.

### 1.3 Target Users
- **Adventurers (Employees/Freelancers):** apply to quests, submit work, gain XP, and earn verified certificates.
- **NPCs (Employers):** post quests, manage applicants, and release gold (payments) upon completion.
- **Guild Master (Admin):** supervises all quests, resolves disputes, handles anomalies, and manages user ranks.

All users access the system via browser dashboards tailored to their roles.

## 2. Functional Requirements

### 2.1 Authentication & Authorization
1. **FR-1:** Users shall register and log in using email and password.
2. **FR-2:** The system shall support three roles – Adventurer, NPC, Guild Master – with unique dashboards.
3. **FR-3:** Only the Guild Master can modify user roles, suspend accounts, or approve new NPCs.
4. **FR-4:** Passwords must be hashed and secured before storage.

### 2.2 Profile Management
1. **FR-5:** Adventurers can update their profile (name, skills, bio, class, XP).
2. **FR-6:** NPCs can edit their organization profile (description, trust rating, domain).
3. **FR-7:** Guild Master can view and edit all profiles for moderation purposes.

### 2.3 Quest Board and Applications
1. **FR-8:** NPCs can post new quests including title, description, skills required, difficulty, reward, and deadline.
2. **FR-9:** Adventurers can browse, filter, and apply for quests.
3. **FR-10:** NPCs can approve or reject quest applications.
4. **FR-11:** The system shall update quest status (Posted → Claimed → In Progress → Completed → Paid).
5. **FR-12:** Adventurers shall receive notifications when a quest is assigned or completed.

### 2.4 Communication & Disputes
1. **FR-13:** Each quest shall have a private chatroom between NPC and Adventurer.
2. **FR-14:** Either party may escalate a chat to the Guild Master (Dispute Mode).
3. **FR-15:** The system shall record all communications for dispute resolution.

### 2.5 Payments & Escrow (Guild Vault)
1. **FR-16:** When a quest is posted, gold (payment) is deposited into Guild Escrow.
2. **FR-17:** Gold shall be released to Adventurer upon quest approval.
3. **FR-18:** The system shall maintain a transaction log (Guild Ledger).
4. **FR-19:** The Guild Master can freeze suspicious transactions or refund gold when justified.

### 2.6 Rewards & Certificates
1. **FR-20:** Upon successful completion, the system shall generate a verifiable "Scroll of Deed."
2. **FR-21:** Adventurers shall gain XP and rank points (F → E → D → C → B → A → S → SS → SSS).
3. **FR-22:** Badges shall be awarded for milestones (e.g., "5 Quests Completed," "1000 Gold Earned").

### 2.7 Analytics & Leaderboard (Guild Hall Dashboard)
1. **FR-23:** System shall display leaderboards for Top Earners, Rising Stars, and Reliable Patrons.
2. **FR-24:** The dashboard shall visualize metrics such as total quests, completion rate, and reputation.
3. **FR-25:** An anomaly detection module shall flag suspicious patterns (e.g., repeated collusion between NPC and Adventurer).
4. **FR-26:** Guild Master shall receive real-time alerts for flagged anomalies or unresolved disputes.

### 2.8 Notifications & Alerts
1. **FR-27:** Users shall receive in-app and email notifications for quest updates, approvals, and payments.
2. **FR-28:** The Guild Master shall receive escalation alerts for overdue disputes or stalled high-value quests.

## 3. Non-Functional Requirements

### 3.1 Performance Requirements
- **NFR-1:** The system shall handle at least 100 concurrent users with < 2 seconds average response time.
- **NFR-2:** Dashboard and leaderboard updates shall refresh within 5 seconds of data change.

### 3.2 Security Requirements
- **NFR-3:** All communication shall occur over HTTPS (SSL/TLS).
- **NFR-4:** User passwords and payment data must be encrypted at rest and in transit.
- **NFR-5:** Role-based access control (RBAC) shall enforce privilege restrictions.
- **NFR-6:** Guild Master actions (e.g., bans, refunds) must be audit-logged for accountability.

### 3.3 Reliability & Availability
- **NFR-7:** The system shall maintain 99% uptime excluding maintenance.
- **NFR-8:** Daily database backups shall be performed automatically.
- **NFR-9:** In case of server failure, automatic restart and recovery must occur within 5 minutes.

### 3.4 Maintainability
- **NFR-10:** Code shall follow consistent naming and folder structure under MVC.
- **NFR-11:** API documentation (Swagger / Postman) shall be maintained for all endpoints.
- **NFR-12:** Each module must be independently deployable and testable via unit tests (Jest).

### 3.5 Scalability
- **NFR-13:** The architecture shall support horizontal scaling of Node instances and Mongo clusters.
- **NFR-14:** The system should handle future integration with external payment or AI recommendation APIs without major refactoring.

### 3.6 Usability and Interface
- **NFR-15:** The web UI shall be responsive and optimized for desktop and mobile devices.
- **NFR-16:** Interfaces must use RPG-themed terminology and visuals while maintaining clarity and accessibility (ARIA compliant).

## Features List

1. Adventurer Profile & Skill Management
2. NPC Organization Profile & Trust Overview
3. Quest Creation & Management (CRUD + Status)
4. Quest Browsing, Filtering & Search
5. Quest Application & Assignment
6. Quest Progress & Work Submission (with Revisions)
7. Quest-Specific Chat Channel
8. Dispute Escalation & Resolution Tools
9. Guild Escrow Creation & Management (Bounty Vault)
10. Payment Release, Refund & Ledger View
11. Scroll of Deeds (Certificate) Generation & Verification
12. Adventurer Dashboard (Quest & Progress View)
13. NPC Dashboard (Quest & Spending View)
14. Guild Master Dashboard (Global Control Panel)
15. XP, Rank & Badge Progression System
16. Adaptive Quest Recommendation Engine
17. Anomaly / Fraud Detection Engine
18. Burnout / Workload Detection & Warnings
19. Global Leaderboards (Adventurers & NPCs)
20. Notification & Alert System

## Tech Stack

- **Frontend:** React JS
- **Backend:** Node JS + Express JS
- **Styling:** TailwindCSS
- **Database:** MongoDB
- **ORM:** Mongoose
- **Deployment:** Vercel (Frontend), Render (Backend)
- **Version control:** GitHub





