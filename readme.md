# Pollify

A real-time polling platform where creators build polls, respondents answer them, and live results stream via WebSockets. Supports anonymous and authenticated responses, role-based access, and a live activity feed.

---

## Tech Stack

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL with Drizzle ORM
- Socket.io (real-time events)
- Nodemailer (email verification + password reset)
- JWT (access + refresh token rotation)

**Frontend**
- React 19 + Vite + TypeScript
- TanStack Router + TanStack Query
- Zustand (state management)
- Tailwind CSS v4 + shadcn/ui
- Socket.io-client
- Framer Motion

---

## Features

- Auth: register, email verification, login, refresh token rotation, forgot/reset password
- Polls: create multi-question polls with options, expiry, and anonymous flag
- Responding: anonymous or authenticated responses, mandatory question enforcement
- Real-time: live vote counts pushed to all listeners via Socket.io
- Analytics: creator-only dashboard with per-option vote breakdowns
- Results: publish-gated public results page
- Feed: live activity feed of poll submissions across the platform

---

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/
│   │   │   │   ├── dto/
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   └── reset-password.dto.ts
│   │   │   │   ├── controller.ts
│   │   │   │   ├── middleware.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── service.ts
│   │   │   ├── polls/
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-polls.dto.ts
│   │   │   │   │   └── submit-response.dto.ts
│   │   │   │   ├── controller.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── services.ts
│   │   │   ├── config/
│   │   │   │   └── email.ts
│   │   │   ├── dto/
│   │   │   │   └── base.dto.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── optional-auth.middleware.ts
│   │   │   │   └── validate.middleware.ts
│   │   │   ├── socket/
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       └── index.ts
│   │   └── index.ts
│   └── db/
│       ├── index.ts        # Drizzle client
│       └── schema.ts       # All table definitions
└── client/
    └── src/
        ├── api/
        │   ├── analytics.api.ts
        │   ├── auth.api.ts
        │   ├── axios.ts
        │   └── polls.api.ts
        ├── components/
        │   ├── ui/
        │   ├── Navbar.tsx
        │   └── theme-provider.tsx
        ├── hooks/
        ├── lib/
        │   ├── socket.ts
        │   └── utils.ts
        └── routes/
            ├── _authenticated/
            │   ├── dashboard.tsx
            │   ├── polls.$pollId.analytics.tsx
            │   ├── polls.$pollId.results.tsx
            │   └── polls.create.tsx
            ├── __root.tsx
            ├── _authenticated.tsx
            ├── explore.tsx
            ├── index.tsx
            ├── login.tsx
            ├── polls.$pollId.tsx
            └── register.tsx
```

---

## Database Schema

```
users
  id, name, email, isVerified, password, role
  verificationToken, refreshToken, resetPasswordToken, resetPasswordExpires

polls
  id, creatorId → users, title, description, isAnonymous, expiresAt, isPublished

questions
  id, pollId → polls (cascade), text, isMandatory, order

options
  id, questionId → questions (cascade), text

responses
  id, pollId → polls (cascade), respondentId → users (nullable = anonymous)

answers
  id, responseId → responses (cascade), questionId, optionId
```

---

## API Reference

### Auth — `/api/auth`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | — | Register new user |
| GET | `/verify-email/:token` | — | Verify email |
| POST | `/login` | — | Login, returns tokens |
| POST | `/refresh` | — | Rotate refresh token |
| POST | `/logout` | ✓ | Clear refresh token |
| POST | `/forgot-password` | — | Send reset email |
| POST | `/reset-password/:token` | — | Reset password |
| GET | `/getMe` | ✓ | Get current user |

### Polls — `/api/polls`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/` | ✓ | Create a poll |
| GET | `/my` | ✓ | Get your polls |
| GET | `/feed` | — | Live public feed (paginated) |
| GET | `/:pollId` | — | Get poll + questions |
| POST | `/:pollId/respond` | Optional | Submit a response |
| GET | `/:pollId/analytics` | ✓ Creator | Vote counts per option |
| PATCH | `/:pollId/publish` | ✓ Creator | Publish results + close poll |
| GET | `/:pollId/results` | — | Public results (if published) |
| DELETE | `/:pollId` | ✓ Creator | Delete poll |

---

## Real-time Events (Socket.io)

**Rooms**
- `poll:<pollId>` — joined by respondents + results page viewers
- `feed` — joined by anyone on the explore/feed page

**Events emitted by server**

`new-response` → room `poll:<pollId>`
```json
{
  "pollId": "uuid",
  "totalResponses": 42,
  "optionCounts": [{ "optionId": "uuid", "count": 10 }]
}
```

`feed-activity` → room `feed`
```json
{
  "pollId": "uuid",
  "pollTitle": "Favorite framework?",
  "totalResponses": 42
}
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL

### Setup

```bash
# Clone
git clone https://github.com/KARDT89/pollify
cd pollify

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### Environment — `server/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/pollify
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_password
CLIENT_URL=http://localhost:5173
```

### Run

```bash
# Push schema to DB
cd server && npx drizzle-kit push

# Start server (dev)
npm run dev

# Start client (dev)
cd ../client && npm run dev
```

---

## Scripts

**Server**
```bash
npm run dev        # ts-node / nodemon dev server
npm run build      # tsc compile
npm run start      # run compiled output
```

**Client**
```bash
npm run dev        # Vite dev server
npm run build      # type-check + build
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run format     # Prettier
```

---

## License

MIT