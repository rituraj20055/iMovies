# 👥 Team Roles & Core Responsibilities

This document outlines the organizational structure, functional responsibilities, and contribution breakdown for the **iMovies** cinema booking platform engineering team.

---

## 📊 Team Responsibility Breakdown Table

| Role Title | Focus Area | Core Responsibilities | Key Modules & Deliverables | Primary Stack & Tools |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Full-Stack Architect** | System Design & Architecture | Overall technical direction, MVC architecture enforcement, real-time concurrency design, and release orchestration. | `start-all.js`, MVC blueprint, architecture documentation, end-to-end integration. | Node.js, React 18, Git, System Design |
| **Frontend Engineer & UI/UX Lead** | Client Application & Design System | Single Page Application (SPA) development, responsive layouts, theme system (Midnight Aurora & Light Mode), and routing. | `client/src/pages/`, `ThemeContext.jsx`, `Header.jsx`, `SeatSlugPage.jsx`, `NotFoundPage.jsx`. | React 18, Vite, CSS3 Variables, FontAwesome, Bootstrap |
| **Backend & API Engineer** | REST API & Real-Time Engine | RESTful API design, controller business logic, WebSocket integration, background cron jobs, and email notifications. | `server/controllers/`, `showController.js`, `cleanupService.js`, `reminderService.js`, `mailer.js`. | Express.js, Socket.io, Node-Cron, Nodemailer, Dayjs |
| **Database & Cloud DevOps Engineer** | Database & Deployment | Database schema modeling, indexing, MongoDB Atlas connectivity, Render hosting, and Vercel edge deployment with SPA rewrites. | `server/models/`, `db.js`, `vercel.json`, Render deployment pipelines, environment configuration. | MongoDB Atlas, Mongoose ODM, Vercel, Render, Bash |
| **Security & Quality Assurance Lead** | Auth, Security & Testing | Role-Based Access Control (RBAC), bcrypt hashing, JWT validation, automated seat-locking stress testing, and session persistence audits. | `fetchUser.js`, `UserProtection.jsx`, `AdminProtection.jsx`, session refresh handling, test suites. | JWT, Bcryptjs, Postman, Jest / Supertest |

---

## 🎯 Detailed Functional Area Ownership

### 1. Frontend & Client-Side Experience
- **Owner**: Frontend Engineer & UI/UX Lead
- **Key Deliverables**:
  - Implementation of the **Midnight Aurora Cinema** design system supporting seamless toggling between Dark and Light mode.
  - Interactive multi-tier seat selection grid (`balcony`, `middle`, `lower`) with live seat state rendering (Available, Selected, Locked, Booked).
  - Responsive calendar date carousel for screening discovery powered by `dayjs`.
  - Comprehensive client-side routing, code splitting, lazy-loading with `React.Suspense`, and graceful custom 404 views.

---

### 2. Backend API & Concurrency Management
- **Owner**: Backend & API Engineer
- **Key Deliverables**:
  - Scalable RESTful endpoints for movies, theaters, screenings, reservations, reviews, and favorites.
  - Concurrency management ensuring multiple concurrent buyers cannot purchase or hold the same seat simultaneously.
  - Real-time room-based WebSocket broadcasting (`io.to(showId).emit('seats-changed')`).
  - Automated worker services (`node-cron`) ensuring abandoned seat reservations are returned to inventory after 10 minutes.

---

### 3. Database Architecture & Infrastructure
- **Owner**: Database & Cloud DevOps Engineer
- **Key Deliverables**:
  - Normalized and denormalized Mongoose models with strict type validations, custom validators, and compound indexes.
  - Production deployment configuration:
    - **Frontend**: Hosted on Vercel with automated SPA rewrites to `/index.html` and reverse proxy for `/api/*`.
    - **Backend**: Hosted on Render with automatic restarts and live health endpoints.
    - **Database**: Multi-region MongoDB Atlas cluster with secure IP access lists and encrypted credentials.

---

### 4. Security, Authentication & Session Reliability
- **Owner**: Security & QA Lead
- **Key Deliverables**:
  - Dual-identity authentication architecture separating ordinary customers from administrators (`userModel` vs `adminModel`).
  - Password hashing utilizing `bcryptjs` with 12 salt rounds.
  - Route guards (`UserProtection` and `AdminProtection`) that inspect cryptographic JWT expiration client-side to prevent session loss on page refresh.
  - CORS policies and sanitized error responses protecting sensitive database configurations.

---

## 🛠️ Contribution Workflow & Best Practices

To maintain code quality and deployment stability, all contributors follow these standardized guidelines:

1. **Branching Strategy**:
   - `main`: Production-ready code deployed to Vercel and Render.
   - `feature/<feature-name>`: Dedicated feature development branches.
   - `fix/<bug-description>`: Bugfix branches.

2. **Pull Request (PR) Checklist**:
   - [ ] Code builds cleanly with zero errors (`npm run build`).
   - [ ] No secrets, passwords, or MongoDB URIs committed to git.
   - [ ] All new routes and models adhere to MVC conventions.
   - [ ] Frontend changes tested in both Dark and Light themes.
   - [ ] Responsive design verified on mobile, tablet, and desktop viewports.

3. **Environment Management**:
   - Development variables maintained in local `.env` files.
   - Production variables configured in Vercel and Render dashboard consoles.
   - `.env.example` kept up to date for newly introduced variables.
