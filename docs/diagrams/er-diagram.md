# 🗄️ Database Entity-Relationship (ER) Diagram

This document models the complete data layer and relational schema for the **iMovies** movie ticket booking platform. While MongoDB is a document-oriented NoSQL database, the application enforces referential integrity, unique constraints, and structured relationships across models via Mongoose schemas.

---

## 📊 Visual ER Diagram

```mermaid
erDiagram
    USER {
        string _id PK
        string username UK "3-20 chars"
        string email UK "lowercase, normalized"
        string password "bcrypt hash (salt rounds 12)"
        date createdAt
        date updatedAt
    }

    ADMIN {
        string _id PK
        string username UK "3-20 chars"
        string email UK "lowercase, normalized"
        string password "bcrypt hash (salt rounds 12)"
        date createdAt
        date updatedAt
    }

    MOVIE {
        string _id PK
        number tmdbId "Indexed, sparse"
        string movieName "2-200 chars"
        string description
        stringArray genres "Action, Drama, etc."
        date releaseDate
        string language
        string duration "e.g. 2h 30m"
        string certification "U, U/A, A"
        string poster "CDN / TMDB URL"
        string backdrop "High-res banner"
        string trailer "YouTube embed ID"
        stringArray cast
        string director
        number rating "0 - 10"
        number voteCount
        string tagline
        boolean isActive "Soft deletion flag"
    }

    THEATRE {
        string _id PK
        string theatreId UK "UUID identifier"
        string theatreName
        string location "City / Address"
        number balconySeatPrice "VIP Tier Price"
        number middleSeatPrice "Premium Tier Price"
        number lowerSeatPrice "Standard Tier Price"
        object balconySeats "Grid layout & map"
        object middleSeats "Grid layout & map"
        object lowerSeats "Grid layout & map"
        string adminEmail "Creator / Manager"
        boolean isActive
    }

    SHOW {
        string _id PK
        string showId UK "UUID identifier"
        string movieId FK "Reference to Movie"
        string movieName "Denormalized for quick read"
        string theatreId FK "Reference to Theatre"
        string theatreName "Denormalized for quick read"
        string showDate "YYYY-MM-DD"
        string showTime "HH:mm (e.g. 19:30)"
        object tickets "Live seat matrix & lock states"
        string adminEmail "Creator reference"
        boolean isActive
    }

    BOOKING {
        string _id PK
        string bookingId UK "e.g. BK1729759281"
        string userEmail FK "User account email"
        string showId FK "Associated Show UUID"
        string movieId FK "Target Movie ID"
        string movieName
        string theatreId FK
        string theatreName
        string showDate
        string showTime
        object ticketsData "Seat tier & pricing breakdown"
        stringArray selectedSeats "['balcony_A1', 'balcony_A2']"
        number totalAmount "Calculated ticket total in INR"
        string paymentStatus "Pending | Completed | Failed | Cancelled"
        string paymentMethod "Razorpay | Card | UPI"
        string orderId "Payment gateway order ID"
        string paymentId "Payment gateway transaction ID"
        string signature "Verification HMAC"
        string refundId "Refund transaction reference"
        number refundAmount
        string refundReason
        date refundedAt
    }

    PAYMENT {
        string _id PK
        string paymentId UK "Razorpay payment id"
        string orderId "Gateway order reference"
        string bookingId FK "Associated Booking ID"
        string userEmail FK "Paying user"
        number amount "Total amount in paise/cents"
        string currency "INR"
        string status "created | authorized | captured | failed | refunded"
        string method "upi | card | netbanking"
        string signature "HMAC-SHA256 signature"
        string refundId
        number refundAmount
        object rawResponse "Gateway webhook payload"
    }

    FAVORITE {
        string _id PK
        string userEmail FK "Indexed compound unique key"
        string movieId FK "Target Movie ID"
        date createdAt
    }

    REVIEW {
        string _id PK
        string userEmail FK "Author of the review"
        string movieId FK "Reviewed Movie ID"
        number rating "1 to 10 scale"
        string reviewText "User commentary"
        date createdAt
    }

    %% Relationships
    USER ||--o{ BOOKING : "places"
    USER ||--o{ FAVORITE : "bookmarks"
    USER ||--o{ REVIEW : "writes"
    
    ADMIN ||--o{ THEATRE : "registers"
    ADMIN ||--o{ SHOW : "schedules"

    MOVIE ||--o{ SHOW : "broadcast in"
    MOVIE ||--o{ BOOKING : "ticketed for"
    MOVIE ||--o{ FAVORITE : "saved in"
    MOVIE ||--o{ REVIEW : "evaluated by"

    THEATRE ||--o{ SHOW : "hosts"

    SHOW ||--o{ BOOKING : "allocated to"
    BOOKING ||--o| PAYMENT : "settled via"
```

---

## 📋 Entity Descriptions & Schema Specifications

### 1. `User` & `Admin`
- **Purpose**: Manage identity, authentication, and role separation.
- **Security**: Passwords hashed using `bcryptjs` with 12 salt rounds. 
- **Tokens**: Issues signed JSON Web Tokens (JWT) with 7-day TTL (`{ id, email, username, isAdmin }`).
- **Separation**: Admins have separate administrative schema and collection to prevent privilege escalation vulnerabilities.

### 2. `Movie`
- **Purpose**: Stores film metadata, media assets, and theatrical distribution properties.
- **Key Features**:
  - Optional `tmdbId` syncing live data from The Movie Database API.
  - Multi-genre classification (`genres: [String]`).
  - Active toggle (`isActive: Boolean`) for non-destructive archiving.

### 3. `Theatre`
- **Purpose**: Physical theater venue layout, tier structures, and dynamic pricing rules.
- **Seat Layout Objects**:
  - `balconySeats`: VIP upper level seating grid with custom row/column assignments.
  - `middleSeats`: Premium view section.
  - `lowerSeats`: Standard pricing section.

### 4. `Show`
- **Purpose**: Represents an active screening scheduled for a specific movie, theater, date, and time.
- **Real-Time Seat Matrix (`tickets`)**:
  - Dynamic key-value dictionary mapping seat labels (e.g. `balcony_B4`) to states:
    - `available`: Open for selection.
    - `locked`: Temporarily held by a user for up to 10 minutes (TTL countdown).
    - `booked`: Confirmed purchase.

### 5. `Booking`
- **Purpose**: Immutable transaction record of confirmed or pending reservations.
- **Audit Trail**: Contains denormalized movie and theater names so historic receipts remain accurate even if an admin renames a theater or movie.

### 6. `Payment`
- **Purpose**: Financial audit log capturing Razorpay payment intents, verification HMACs, order identifiers, and cancellation refunds.

### 7. `Favorite` & `Review`
- **Purpose**: User engagement and social features.
- **Indexes**: `favoriteSchema.index({ userEmail: 1, movieId: 1 }, { unique: true })` strictly enforces that a user can bookmark each movie at most once.
