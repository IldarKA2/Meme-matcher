# Meme Tinder

## 1. Project Description

Meme Tinder is a full-stack, Tinder-style meme swiping web application. Users browse a deck of memes, swipe right to like or swipe left to dislike, and save their favorites for later. A dedicated profile page tracks swipe statistics, and once a user has liked at least 10 memes, a matching page unlocks and reveals other users with a similar sense of humor.

The application is intentionally built without any artificial intelligence or machine learning. Matching is performed with a deterministic Jaccard similarity algorithm that scores overlap between liked memes, making the compatibility logic fully transparent and reproducible.

---

## 2. Installation and Running Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ (or [Bun](https://bun.sh/))
- A Supabase / Lovable Cloud project with the required environment variables

### Step 1 — Clone the repository

```bash
git clone <repository-url>
cd meme-tinder
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the browser or client bundles.

### Step 4 — Set up the Supabase backend

Apply the project migrations to create the following tables in the `public` schema:

- `users` — anonymous device profiles
- `memes` — meme records (template-based or uploaded images)
- `swipes` — like/dislike actions per device and meme
- `saved_memes` — saved meme records per device
- `user_statistics` — aggregated swipe/save counters and top category

Enable Row Level Security (RLS) and verify that `GRANT` statements are present for `authenticated` and `service_role` roles.

Create a private Storage bucket named `memes` for uploaded meme images. Images are served through the server-side proxy at `/api/public/meme-image/:id`, so the bucket does not need to be public.

### Step 5 — Run the development server

```bash
npm run dev
```

Open the app at `http://localhost:8080`.

### Step 6 — Build and preview for production

```bash
npm run build
npm run preview
```

---

## 3. Design and Development Process

### Architecture overview

The application follows a unified full-stack architecture:

- **Frontend** — React 19 with TanStack Router for type-safe routing and TanStack Query v5 for server-state management. Tailwind CSS v4 provides the styling layer.
- **Full-stack / API layer** — TanStack Start v1 server routes under `src/routes/api/` expose REST endpoints and server functions. Server-only modules (`*.server.ts`) interact with Supabase using the service-role key.
- **Database** — Supabase PostgreSQL stores users, memes, swipes, saved memes, and computed statistics. Foreign keys, unique constraints, and cascading deletes preserve relational integrity.
- **Storage** — Supabase Storage bucket `memes` holds uploaded images. The browser never talks directly to Storage; instead, the server proxies and caches images via `/api/public/meme-image/:id`.

### Interaction flow

1. The browser generates a stable anonymous `device_id` and stores it in `localStorage`.
2. The client requests a batch of unswiped memes from `GET /api/memes/random` using the `deviceId` query parameter.
3. Swipes and saves are sent to `POST /api/swipes` and `POST /api/memes/save`; the server persists the action, recalculates statistics, and returns the updated counters.
4. The profile page fetches persisted statistics from `GET /api/users/statistics`.
5. The matches page fetches deterministic matches from `GET /api/users/matches` once the user has liked at least 10 memes.
6. Images are rendered through `/api/public/meme-image/:id`, which fetches from Memegen or Supabase Storage on the server and streams the bytes back to the client.

### Main development stages

1. **Database schema** — designed normalized tables for users, memes, swipes, saves, and statistics with RLS and explicit grants.
2. **Deck persistence** — built server-side random selection that excludes already-swiped memes and returns remaining counts.
3. **Swipe gestures and depth stack** — implemented pointer/touch dragging, rotational transforms, LIKE/NOPE visual stamps, stacked next-card depth, and keyboard shortcuts.
4. **Jaccard matching** — implemented deterministic similarity scoring without any AI/ML models.
5. **Custom meme uploads** — added `image_url` and `image_path` support, uploaded 70 custom images to Supabase Storage, and inserted corresponding `memes` rows.
6. **Server-side image proxy** — ensured external image services and Storage are only contacted from the server.
7. **Optimistic UI updates** — counters and deck advancement update instantly while the API call runs in the background, with rollback on failure.

---

## 4. Unique Approaches and Methodologies

- **Gesture-driven swipe interface** — Pointer and touch events drive card translation and rotation. A green "LIKE" stamp fades in on right drag, and a red "NOPE" stamp fades in on left drag. The next card is stacked behind with subtle scale and shadow to create realistic depth.
- **Optimistic UI with silent background sync** — Swipes, saves, and statistics update the UI immediately. The server request fires asynchronously; if it fails, the card returns and the counter rolls back.
- **Deterministic Jaccard matching** — After 10 likes, the server queries all other users' liked meme IDs, computes `|intersection| / |union|` as a similarity ratio, converts it to a whole-percentage compatibility score, and ranks matches in descending order. No AI or ML is involved.
- **Persistent anonymous sessions** — A random UUID stored in `localStorage` acts as the device identity. This removes sign-up friction while still providing persistent profiles, statistics, and saved memes within the same browser.
- **Server-side image proxying and validation** — All meme images are fetched by the backend. This avoids CORS issues in the browser, keeps Storage buckets private, and prevents service-role secrets from reaching client code.

---

## 5. Development Trade-offs

- **Device ID session model vs. full account auth** — We chose a `localStorage` device ID for zero-friction onboarding and seamless grading/testing. The trade-off is that profiles are bound to a single browser; clearing cache or switching devices resets the anonymous identity.
- **Mathematical Jaccard similarity vs. AI/ML embeddings** — We deliberately used a deterministic Jaccard score. It is transparent, computationally lightweight, requires no external API, and incurs no latency or cost. It is less nuanced than learned embeddings but fully satisfies the no-AI requirement.
- **Deck batch prefetching vs. single-card queries** — The app fetches batches of 3 unswiped memes at a time. This reduces database roundtrips while keeping memory usage low and the UI responsive.
- **Optimistic updates with rollback on failure** — We prioritized a native, instant-feeling interface over synchronous locking. The rare failed request rolls back state and allows the user to retry.

---

## 6. Known Bugs and Limitations

- **No known critical bugs.** The application builds successfully, passes type checking, and has been verified through automated browser tests for swiping, saving, statistics, and matching.
- **Device-bound profiles** — Because users are identified by a browser-stored `device_id`, clearing local storage or using a different browser/device creates a new anonymous profile and loses saved memes and statistics.
- **Deck exhaustion** — Once every meme in the database has been swiped, the deck is empty until the user resets their swipe history.
- **Internet connection required** — Swipes, saves, statistics, and matches rely on server-side persistence, so an active connection is required for these features to work.

---

## 7. Technology Stack

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **React 19** | UI library | Industry-standard component model with strong ecosystem support and modern concurrent features. |
| **TypeScript 5** | Language | Static typing catches errors at build time and improves long-term maintainability. |
| **TanStack Start v1** | Full-stack React framework | Unifies server routes, server functions, SSR, and routing in a single type-safe codebase. |
| **TanStack Router** | Routing | Type-safe file-based routing with automatic route generation. |
| **TanStack Query v5** | Server-state management | Robust caching, optimistic mutations, background refetching, and stale-while-revalidate behavior. |
| **Tailwind CSS v4** | Styling | Utility-first CSS enables rapid, consistent styling without runtime overhead or custom CSS files. |
| **Supabase / PostgreSQL** | Database | Relational integrity via foreign keys, cascade deletes, RLS policies, and a generous free tier. |
| **Supabase Storage** | File storage | Stores uploaded meme images privately and serves them through the server-side proxy. |
| **Zod** | Validation | Declarative schema validation for API inputs and query parameters. |
| **Radix UI + Lucide React** | UI primitives and icons | Accessible, unstyled components and a consistent icon set. |
| **Vite 8** | Build tool | Fast development server and optimized production builds. |

---

## Backend REST API Summary

All endpoints return JSON with `content-type: application/json`. Error responses follow the shape `{"error": "..."}`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/memes/random?deviceId=...&count=3` | Random unswiped memes |
| `POST` | `/api/swipes` | Record like/dislike |
| `POST` | `/api/memes/save` | Save a meme |
| `DELETE` | `/api/memes/save` | Remove a saved meme |
| `GET` | `/api/memes/saved?deviceId=...` | List saved memes |
| `GET` | `/api/users/statistics?deviceId=...` | Get user statistics |
| `GET` | `/api/users/matches?deviceId=...` | Get humor matches (requires 10 likes) |
| `GET` | `/api/public/meme-image/:id?width=600` | Server-side image proxy |

---

This project was built with [Lovable](https://lovable.dev). The code is yours to modify, deploy, and distribute as you see fit.
