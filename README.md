# 🎬 iMovies - Movie Ticket Booking Platform

> **Movie ticket booking made simple.**
> A modern, responsive, full-stack Movie Ticket Booking Web Application built with React.js, Node.js, Express, MongoDB (Mongoose), Socket.io, and Bootstrap / Tailwind-inspired cinema styling.

---

## 📁 Project Documentation

Detailed system architecture blueprints, entity relationships, user journeys, and team role allocations are thoroughly documented inside the [`docs/`](./docs) directory:

| Document | Focus Area | Description |
| :--- | :--- | :--- |
| 🏛️ **[System Architecture & MVC Implementation](./docs/architecture.md)** | Engineering & Design | Complete breakdown of Models, Views, Controllers, data flow, real-time concurrency, and security. |
| 👥 **[Team Roles & Responsibilities](./docs/roles.md)** | Governance & Execution | Functional ownership matrix, core responsibilities, and contribution guidelines. |
| 🗄️ **[Database Entity-Relationship (ER) Diagram](./docs/diagrams/er-diagram.md)** | Data Layer | Visual Mermaid.js relational schema covering all 9 Mongoose models, keys, and constraints. |
| 🧭 **[End-to-End User Flow Diagram](./docs/diagrams/user-flow.md)** | Experience & Workflows | Visual Mermaid.js journey diagram detailing customer onboarding, seat locking, and admin controls. |

---

## 🌟 Key Features

### 👤 User Capabilities
- **Live TMDB Market Integration**: Connects directly to The Movie Database (TMDB) API to stream live, real-time Now Playing, Trending, and Popular movies into the theater booking engine.
- **Rich Landing Hero Section**: Modern dark cinema theme with blockbuster showcases and dynamic CTAs.
- **Authentication**: JWT token validation, bcrypt password hashing, session management, and persistent login.
- **Now Showing & Filterable Catalog**: Real-time search by movie title, genre filter, and language filter powered by live TMDB queries.
- **Movie Details & Media Hub**: Full movie synopsis, duration, certification, cast badges, embedded trailers, and live user reviews.
- **Interactive Showtime Selector**: Dayjs-powered multi-day date carousel and showtime selector grouped by theatre location.
- **Interactive Multi-Tier Seat Map**:
  - Distinct colored seat tiers: **Balcony (VIP)**, **Middle (Premium)**, and **Lower (Standard)**.
  - Real-time seat status: *Available*, *Selected*, *Locked*, and *Booked*.
  - **Temporary Seat Locking Mechanism**: 10-minute TTL countdown timer preventing double-booking across concurrent sessions.
  - Live availability updates via **WebSocket / Socket.io**.
- **Instant Booking & Checkout**: Simulated payment gateway with UPI / Card options and printable digital ticket view.
- **Watchlist & Favorites**: Save and manage upcoming movie watchlist with one-click toggles.
- **Profile Dashboard**: User profile stats, booking activity logs, and account details.

### 🛡️ Admin Management Console
- **Analytics Dashboard**: Real-time revenue analytics, total bookings, movie listings, theatres, and user moderation.
- **Movie Management**: Create, edit, and delete movie listings with poster URLs, trailer links, genres, and cast metadata.
- **Theatre & Tier Pricing Setup**: Register venues with dynamic pricing for Balcony, Middle, and Lower tiers and auto-generated seat layouts.
- **Show Scheduling**: Schedule shows linking movies, theatres, dates, and times.
- **Reservations & Moderation**: View all platform reservations with search, filtering, and refund/cancellation controls.
- **Sub-Admin Delegation**: Grant and manage administrative permissions.

### ⚙️ Automation & Real-Time Engine
- **Socket.io Live Sync**: Instant seat lock/release broadcasting to all clients viewing the seat map.
- **Node-Cron Cleanup**: Automatic background cron running every 5 minutes releasing expired temporary seat locks (`cleanupService.js`).
- **Show Reminders**: Automated notification service checking upcoming showtimes (`reminderService.js`).
- **Zero-Config DB Fallback**: Automatically connects to local MongoDB or starts an in-memory MongoDB server with 80+ sample shows, movies, theatres, and default accounts pre-seeded!

---

## 🏗️ Architecture & Tech Stack

```
iMovies/
├── docs/                       # Project Documentation
│   ├── architecture.md         # MVC Pattern & System Architecture
│   ├── roles.md                # Team Roles & Contribution Matrix
│   └── diagrams/               # Mermaid.js ER & User Flow Diagrams
│       ├── er-diagram.md       # Database Schema & Entity Relationships
│       └── user-flow.md        # Customer & Admin Flowcharts
├── client/                     # Frontend (Vite + React.js)
│   ├── src/
│   │   ├── components/         # Header, Footer, Loader, MovieCard, AdminSidebar
│   │   ├── hooks/              # useFetch custom hook
│   │   ├── pages/              # Landing, Login, Register, Home, Details, Shows, SeatMap, Bookings, Watchlist, Profile
│   │   │   └── admin/          # Dashboard, AddMovie, AddTheatre, AddShow, AddAdmin, AdminBookings
│   │   ├── utils/              # Axios client (api.js), UserProtection, AdminProtection
│   │   ├── App.jsx             # React Router DOM with lazy-loading & Suspense
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js          # Port 5173 with proxy to backend port 5050
└── server/                     # Backend (Node.js + Express)
    ├── controllers/            # Auth, Movies, Theatres, Shows, Bookings, Favorites, Reviews
    ├── middlewares/            # fetchUser.js (dual JWT & Bearer validation)
    ├── models/                 # Mongoose models for all 8 core entities
    ├── routes/                 # Express modular REST API routes
    ├── services/               # tmdbService.js (live market movie integration via TMDB API)
    ├── utils/                  # db.js, seedData.js, cleanupService.js, reminderService.js, mailer.js
    ├── server.js               # Express & Socket.io entry point
    └── .env                    # Environment configuration
```

---

## 🔑 Default Credentials (Pre-Seeded)

When launched, the system automatically seeds sample accounts and movies:

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | `admin@imovies.com` | `admin123` |
| **User** | `user@imovies.com` | `user123` |

---

## 🚀 Quick Start Guide

### Option 1: Run Both Frontend & Backend Together (Recommended)

From the project root:
```bash
cd /Users/riturajkourav/.gemini/antigravity/scratch/iMovies
node start-all.js
```

### Option 2: Run Separately

**Terminal 1 — Backend:**
```bash
cd /Users/riturajkourav/.gemini/antigravity/scratch/iMovies/server
npm run dev
```
*Backend runs on: `http://localhost:5050`*

**Terminal 2 — Frontend:**
```bash
cd /Users/riturajkourav/.gemini/antigravity/scratch/iMovies/client
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/validate` - Validate user session token
- `POST /api/auth/admin/register` - Create admin account
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/admin/validate` - Validate admin session token
- `GET /api/auth/admin/users` - View registered users
- `DELETE /api/auth/admin/users/:id` - Moderation / remove user
- `GET /api/auth/admin/stats` - Platform revenue and booking analytics

### Movies (`/api/movie`)
- `GET /api/movie` - Filter by genre, language, and search query
- `GET /api/movie/featured` - Top featured movies
- `GET /api/movie/:id` - Movie details
- `POST /api/movie` - Admin: Add movie
- `PUT /api/movie/:id` - Admin: Update movie
- `DELETE /api/movie/:id` - Admin: Delete movie

### Theatres (`/api/theatre`)
- `GET /api/theatre` - List all theatres
- `GET /api/theatre/:id` - Theatre details & tier pricing
- `POST /api/theatre` - Admin: Add theatre
- `PUT /api/theatre/:id` - Admin: Update theatre
- `DELETE /api/theatre/:id` - Admin: Delete theatre

### Shows (`/api/shows`)
- `GET /api/shows` - List all shows (or filter by `?movieId=...`)
- `GET /api/shows/movie/:movieId` - Shows grouped for a specific movie
- `GET /api/shows/:id` - Show details with live seat matrix
- `POST /api/shows/lock-seats` - Temporarily lock seats with 10-minute TTL
- `POST /api/shows/release-locks` - Release temporary seat lock
- `POST /api/shows` - Admin: Schedule show
- `PUT /api/shows/:id` - Admin: Update show
- `DELETE /api/shows/:id` - Admin: Delete show

### Bookings (`/api/bookings`)
- `POST /api/bookings` - Confirm booking & finalize payment
- `GET /api/bookings/user` - Fetch logged-in user's booking history
- `GET /api/bookings/admin/all` - Admin: All platform reservations
- `PUT /api/bookings/cancel/:bookingId` - Cancel booking and release seats

### Watchlist & Reviews (`/api/favorite` & `/api/review`)
- `GET /api/favorite` - Fetch user's saved movie watchlist
- `POST /api/favorite` - Add movie to watchlist
- `DELETE /api/favorite/:movieId` - Remove movie from watchlist
- `GET /api/review/:movieId` - Fetch movie reviews
- `GET /api/review/movie/:movieId/rating` - Average rating & review count
- `POST /api/review` - Post / update user review
- `DELETE /api/review/:id` - Delete review
