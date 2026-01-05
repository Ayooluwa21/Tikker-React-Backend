# Tikker - Server

Event management and ticket booking backend using Express, MongoDB, and JWT authentication.

## Quick Start

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`:
```bash
cp .env.example .env
# Edit .env with your MongoDB connection and JWT secret
```

2. Install dependencies:
```bash
npm install
```

3. Run in development with nodemon:
```bash
npm run dev
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /api/health` — Server status check

### Authentication
- `POST /api/auth/register` — Register a new user
  - Body: `{ name, email, password, role? }`
  - Role: `user` (default), `organizer`, or `admin`
  - Validates: email format, password ≥ 6 chars

- `POST /api/auth/login` — Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

### Events
- `GET /api/events` — List all events (public)

- `GET /api/events/:id` — Get event details (public)

- `POST /api/events` — Create event (organizer only, requires auth)
  - Body: `{ title, description?, date?, time?, venue?, category?, ticketTypes?, image? }`
  - ticketTypes: `[{ name, price, quantity }]`
  - Validates: title required, ticket prices/quantities ≥ 0

- `PUT /api/events/:id` — Update event (owner or admin, requires auth)
  - Body: same as create event

- `DELETE /api/events/:id` — Delete event (owner or admin, requires auth)

### Bookings
- `POST /api/bookings` — Create booking (requires auth)
  - Body: `{ eventId, tickets }`
  - tickets: `[{ name, quantity }]`
  - Validates: positive quantities, ticket availability, event not in past
  - Deducts ticket quantities using transaction

- `GET /api/bookings/my-bookings` — List user's bookings (requires auth)
  - Returns bookings for authenticated user sorted by creation date

## Authentication

Protected endpoints require `Authorization: Bearer <token>` header.
- Token obtained from `/api/auth/register` or `/api/auth/login`
- Token expires in 7 days

## Features

- **JWT Auth**: secure token-based authentication
- **Role-based access**: user, organizer, admin roles
- **Event management**: organizers create/manage events with ticket types
- **Ticket booking**: authenticated users book tickets with transaction safety
- **Validation**: input validation on auth, events, and bookings
- **MVC structure**: models, controllers, routes, middleware organized by domain

## Project Structure

```
src/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── eventController.js    # Event CRUD
│   ├── bookingController.js  # Booking creation & retrieval
│   └── healthController.js   # Health check
├── middleware/
│   ├── auth.js               # JWT verification
│   └── authorize.js          # Role-based authorization
├── models/
│   ├── User.js               # User schema with bcrypt hashing
│   ├── Event.js              # Event schema with ticket types
│   └── Booking.js            # Booking schema
└── routes/
    ├── health.js
    ├── auth.js
    ├── events.js
    └── bookings.js
server.js                      # Express app entry point
```
