# 🧭 User Flow & System Journey Diagram

This document illustrates the end-to-end journey of users, visitors, and administrators through the **iMovies** cinema booking platform. It details user decisions, authentication checks, real-time seat locking, payment execution, and administrative workflows.

---

## 🔄 End-to-End Visual User Flow

```mermaid
flowchart TD
    %% Entry Points
    Start(["🌐 Visitor Enters iMovies"]) --> Landing["Landing Page (/landing)<br>Hero Spotlight, Trending, Value Props"]

    %% Browsing & Discovery
    Landing --> Action1{"User Choice"}
    Action1 -->|"Explore Movies"| Home["Catalog / Explore (/home)<br>Live Search, Genre & Language Filters"]
    Action1 -->|"Sign In"| Login["Login Portal (/login)"]
    Action1 -->|"Sign Up"| Register["Registration (/register)"]
    Action1 -->|"Admin Access"| AdminLogin["Admin Portal Login (/admin-login)"]

    %% Authentication Processing
    Register -->|"Submit Form"| AuthAPI1["POST /api/auth/register<br>bcrypt hashing + JWT generation"]
    Login -->|"Submit Credentials"| AuthAPI2["POST /api/auth/login<br>Credential Validation"]
    
    AuthAPI1 -->|"Success"| SessionStore["Store userToken in localStorage<br>Update Auth State"]
    AuthAPI2 -->|"Success"| SessionStore
    SessionStore --> Home

    %% Movie Discovery to Show Selection
    Home -->|"Click Movie Card"| Details["Movie Details (/moviedetails/:id)<br>Trailer, Cast, Synopsis, Rating"]
    Details -->|"Toggle Bookmark"| FavAction["POST/DELETE /api/favorite<br>Update Watchlist"]
    Details -->|"Submit Rating"| ReviewAction["POST /api/review<br>Recalculate Average Rating"]
    Details -->|"Click 'Book Tickets'"| ShowSelect["Show Selection (/movieshows/:id)<br>7-Day Calendar Carousel"]

    %% Seat Selection & Real-Time Locking
    ShowSelect -->|"Select Theatre & Time"| SeatMap["Interactive Seat Map (/seatslug/:showId)<br>Balcony (VIP), Middle (Premium), Lower (Standard)"]
    SeatMap -->|"Select Available Seats"| LockPrompt{"Proceed to Reserve?"}
    
    LockPrompt -->|"Yes"| LockAPI["POST /api/shows/lock-seats<br>Temporary 10-Minute Lock"]
    LockAPI -->|"Emit Socket.io"| SocketBroadcast["Socket.io: 'seats-changed'<br>Broadcast locked seats to all peers"]
    LockAPI -->|"Timer Starts"| Countdown["10:00 Countdown Timer<br>Auto-released on expiration by node-cron"]
    
    Countdown -->|"User Cancels or Times Out"| ReleaseAPI["POST /api/shows/release-locks<br>Seats marked available"]
    ReleaseAPI --> SeatMap

    %% Checkout & Payment
    Countdown -->|"User Proceeds to Pay"| Checkout["Checkout & Payment Modal<br>UPI / Credit Card / NetBanking"]
    Checkout -->|"Submit Payment"| PaymentProcess["Simulate Razorpay Gateway<br>POST /api/bookings"]
    
    PaymentProcess -->|"Payment Succeeded"| BookedState["Update Tickets Status to 'booked'<br>Generate unique Booking ID (BK...)"]
    BookedState --> EmailNotify["Send Booking Email Notification<br>(mailer.js / Nodemailer)"]
    EmailNotify --> Confirmation["Confirmation & Digital Ticket<br>QR Code & Print Option"]
    Confirmation --> BookingsPage["My Bookings Page (/bookings)<br>Active & Past Reservations"]

    %% Admin Workflow
    AdminLogin -->|"Submit Admin Credentials"| AdminAuth["POST /api/auth/admin/login"]
    AdminAuth -->|"Success"| AdminToken["Store adminToken in localStorage"]
    AdminToken --> AdminDashboard["Admin Console (/admin)<br>Revenue, Booking Velocity, Occupancy Analytics"]

    AdminDashboard --> AdminOps{"Admin Operation"}
    AdminOps -->|"Add/Edit Movies"| AddMovie["Movie Manager (/addmovie)<br>TMDB Auto-Fill or Manual Entry"]
    AdminOps -->|"Add/Edit Theatres"| AddTheatre["Theatre Setup (/addtheatre)<br>Pricing Rules & Grid Generation"]
    AdminOps -->|"Schedule Screenings"| AddShow["Show Scheduler (/addshow)<br>Date, Time, Seat Matrix Mapping"]
    AdminOps -->|"Manage Bookings"| AdminBookings["Booking Audit (/adminbookings)<br>Filter, Search, Issue Refunds"]
    AdminOps -->|"Delegate Admins"| AddAdmin["Admin Management (/addadmin)<br>Role & Permission Assignment"]

    %% Styling classes
    classDef entry fill:#111A2E,stroke:#36D9FF,stroke-width:2px,color:#F4F7FF;
    classDef process fill:#17233A,stroke:#8B5CF6,stroke-width:1px,color:#F4F7FF;
    classDef admin fill:#1E1B4B,stroke:#F59E0B,stroke-width:2px,color:#F4F7FF;
    classDef success fill:#064E3B,stroke:#10B981,stroke-width:2px,color:#F4F7FF;

    class Start,Landing,Home,Details,ShowSelect,SeatMap,Checkout entry;
    class LockAPI,SocketBroadcast,PaymentProcess,BookedState,EmailNotify process;
    class AdminLogin,AdminDashboard,AddMovie,AddTheatre,AddShow,AdminBookings,AddAdmin admin;
    class Confirmation,BookingsPage success;
```

---

## 📌 Phase-by-Phase Walkthrough

### Phase 1: Entry & Discovery
1. **Landing View**: Visitors arrive on the high-impact Midnight Aurora cinema landing page featuring featured billboard trailers and fast CTAs.
2. **Catalog Exploration**: The user navigates to `/home` to browse trending movies with live instant search, multi-genre tag filtering, and language sorting.
3. **Movie Synopsis**: Users click into `/moviedetails/:id` to inspect release dates, age certification, high-definition posters, director/cast badges, and aggregated community reviews.

---

### Phase 2: Show Scheduling & Date Selection
1. **Interactive Day Carousel**: In `/movieshows/:movieId`, the user selects from the next 7 calendar days powered by `dayjs`.
2. **Venue Organization**: Shows scheduled for that day are dynamically grouped by theater venue (`theatreName` and `location`).
3. **Showtime Card**: Displays theater amenities, audio formats, and available time slots.

---

### Phase 3: Interactive Seat Map & Real-Time Locking
1. **Multi-Tier Layout**: In `/seatslug/:showId`, the seat matrix renders distinct tiers:
   - **Balcony (VIP)**: Top-tier elevated seating.
   - **Middle (Premium)**: Center view.
   - **Lower (Standard)**: Front rows.
2. **Concurrency Control**:
   - When a user clicks available seats and confirms selection, a `POST /api/shows/lock-seats` request locks the seats for **10 minutes**.
   - Socket.io immediately emits a `seats-changed` event to all other clients connected to that `showId` room, disabling those seats in real-time.
   - A background cron worker (`cleanupService.js`) running every 5 minutes automatically releases any locks exceeding the 10-minute TTL if checkout is abandoned.

---

### Phase 4: Checkout & Ticket Delivery
1. **Order Summary**: Shows total price, booking fee, tier breakdown, and applied seat numbers.
2. **Payment Processing**: Simulated gateway checkout captures payments securely with transaction status recorded in `Payment` and `Booking` models.
3. **Instant E-Ticket**: Upon payment confirmation, the seat status switches to `booked`, an automated HTML email receipt is dispatched, and the ticket is available on the `/bookings` screen.

---

### Phase 5: Administrative Lifecycle
1. **Access Control**: Admin routes are protected by `AdminProtection.jsx` and backend `fetchAdmin` middleware requiring valid `isAdmin: true` JWT claims.
2. **Live Statistics**: Real-time aggregation of platform revenue, total ticket counts, active screenings, and user growth.
3. **Management Capabilities**: Seamlessly create or archive movie titles, configure custom theater seat layouts with dynamic tier prices, schedule new screening dates, and process cancellations.
