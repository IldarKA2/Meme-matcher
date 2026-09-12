# Meme Tinder

A full-stack, Tinder-style meme swiping application. Users swipe through a curated deck of memes, like or dislike them, save favorites, track their stats, and—once they have liked at least 10 memes—discover other users with a similar sense of humor through a deterministic Jaccard similarity algorithm. No AI or machine learning is used anywhere in the matching logic.

---

## Main Features

- **Tinder-style swipe interface** with smooth pointer/touch drag gestures, dynamic card rotation, and stacked depth for the next card.
- **Visual gesture feedback** — green "LIKE" stamp on right drag, red "NOPE" stamp on left drag, and smooth exit animations.
- **Prominent action controls** — Like, Dislike, and Save buttons with hover/press states and keyboard shortcuts:
  - `→` or `D` = Like
  - `←` or `A` = Dislike
  - `S` = Save / unsave
- **Optimistic UI updates** — counters and the saved state update instantly; the next card slides in immediately on save or swipe, with the API call running in the background.
- **Saved memes page** — browse all memes saved by the current user.
- **Profile statistics** — total swipes, likes, dislikes, saves, and top category.
- **Deterministic matching** — unlocked after 10 likes; matches are ranked by exact Jaccard similarity over shared liked memes, with no AI/ML.
- **Responsive UI** — optimized for both desktop and mobile, with touch-action guards to prevent awkward scrolling while dragging cards.
- **Server-side image proxy** — external meme generation and uploaded storage images are fetched by the backend, never directly by the browser.

---

## Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TanStack Start v1](https://tanstack.com/start) (full-stack React framework with SSR/SSG and server functions)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Build tool:** [Vite 8](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State & data fetching:** [TanStack Query v5](https://tanstack.com/query)
- **Backend / database:** [Lovable Cloud / Supabase](https://lovable.dev) — PostgreSQL with Row Level Security (RLS)
- **Validation:** [Zod](https://zod.dev/)
- **UI primitives:** [Radix UI](https://www.radix-ui.com/) + [Lucide React](https://lucide.dev/)

---

## Database Structure

All tables live in the `public` schema. Anonymous users are identified by a stable `device_id` stored in `localStorage`.

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `device_id` | `text` | Unique anonymous identifier |
| `created_at` | `timestamptz` | Account creation time |
| `last_active_at` | `timestamptz` | Updated on every request |

### `memes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `template` | `text` | Meme template identifier (e.g. `drake`) |
| `lines` | `text[]` | Caption lines for template-based rendering |
| `language` | `text` | `en`, `ru`, etc. |
| `category` | `text` | Humor category |
| `image_url` | `text` | Optional direct image URL |
| `image_path` | `text` | Optional private storage path |
| `created_at` | `timestamptz` | Insertion time |

### `swipes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `device_id` | `text` | References `users(device_id)` |
| `meme_id` | `uuid` | References `memes(id)` |
| `action` | `text` | `like` or `dislike` |
| `created_at` | `timestamptz` | Insertion time |

Unique on `(device_id, meme_id)` — re-swipe updates the existing row.

### `saved_memes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `device_id` | `text` | References `users(device_id)` |
| `meme_id` | `uuid` | References `memes(id)` |
| `created_at` | `timestamptz` | Insertion time |

Unique on `(device_id, meme_id)`.

### `user_statistics`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `device_id` | `text` | Unique, references `users(device_id)` |
| `total_swipes` | `integer` | Total swipe count |
| `likes_count` | `integer` | Like count |
| `dislikes_count` | `integer` | Dislike count |
| `saves_count` | `integer` | Saved meme count |
| `top_category` | `text` | Most-liked category |
| `updated_at` | `timestamptz` | Last recalculation time |

Statistics are recalculated server-side after every swipe or save change.

---

## Backend REST API Endpoints

All endpoints return JSON with `content-type: application/json`. Error responses follow the shape `{"error": "..."}`.

### `GET /api/memes/random`
Returns a batch of random memes the user has not yet swiped.

**Query params**
- `deviceId` (required, string, min length 8)
- `count` (optional, integer 1–20, default `3`)

**Response `200 OK`**
```json
{
  "memes": [
    {
      "id": "uuid",
      "template": "drake",
      "lines": ["top text", "bottom text"],
      "language": "en",
      "category": "relatable",
      "image_url": null,
      "image_path": null
    }
  ],
  "remaining": 42,
  "exhausted": false
}
```

### `POST /api/swipes`
Records a like or dislike.

**Body**
```json
{
  "deviceId": "string",
  "memeId": "uuid",
  "action": "like" | "dislike"
}
```

**Response `200 OK`**
```json
{
  "success": true,
  "statistics": { "total_swipes": 5, "likes_count": 3, ... }
}
```

**Errors:** `400` for invalid body, `404` if meme does not exist, `500` for server errors.

### `POST /api/memes/save`
Saves a meme for the user.

**Body**
```json
{ "deviceId": "string", "memeId": "uuid" }
```

**Response `200 OK`**
```json
{
  "success": true,
  "statistics": { "saves_count": 2, ... }
}
```

### `DELETE /api/memes/save`
Removes a saved meme.

**Body**
```json
{ "deviceId": "string", "memeId": "uuid" }
```

**Response `200 OK`**
```json
{
  "success": true,
  "statistics": { "saves_count": 1, ... }
}
```

### `GET /api/memes/saved`
Returns all memes saved by the user.

**Query params**
- `deviceId` (required)

**Response `200 OK`**
```json
{
  "memes": [ /* full meme objects */ ]
}
```

### `GET /api/users/statistics`
Returns persisted user statistics.

**Query params**
- `deviceId` (required)

**Response `200 OK`**
```json
{
  "statistics": {
    "total_swipes": 10,
    "likes_count": 7,
    "dislikes_count": 3,
    "saves_count": 2,
    "top_category": "relatable",
    "updated_at": "..."
  }
}
```

### `GET /api/users/matches`
Returns matching users once the current user has liked at least 10 memes.

**Query params**
- `deviceId` (required)

**Response `200 OK` — locked**
```json
{
  "unlocked": false,
  "currentLikes": 7,
  "likesRequired": 10,
  "users": []
}
```

**Response `200 OK` — unlocked**
```json
{
  "unlocked": true,
  "currentLikes": 12,
  "likesRequired": 10,
  "users": [
    {
      "device_id": "string",
      "shared_likes": 6,
      "compatibility": 85,
      "top_category": "relatable",
      "likes_count": 20,
      "shared_memes": [ /* meme objects */ ]
    }
  ]
}
```

### `GET /api/public/meme-image/:id`
Server-side proxy for meme images. Supports `?width=200..1200` (default `600`).

**Response**
- `200 OK` — image bytes (`image/png` or source content-type)
- `400` — invalid UUID
- `404` — meme not found
- `502` — upstream image unavailable

---

## Environment Variables

Create a `.env` file in the project root with the following variables. Do not commit `.env` to version control.

| Variable | Required for | Description |
|----------|--------------|-------------|
| `VITE_SUPABASE_URL` | Client / server | Public Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client / server | Public Supabase anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Client | Supabase project identifier |
| `SUPABASE_URL` | Server | Same project URL, used server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged service-role key; never expose to the browser |

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is imported only in server-side files (`*.server.ts` and TanStack server route handlers). It must never be referenced in client components or bundled into the frontend.

---

## Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) 20+ (or [Bun](https://bun.sh/))
- A Supabase / Lovable Cloud project with the variables above

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meme-tinder
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file in the project root and add the variables listed in the **Environment Variables** section above.


4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open the app**
   Navigate to `http://localhost:8080` (or the port shown in the terminal).

---

## Supabase Setup

1. **Run migrations** — apply the existing migrations to create the `users`, `memes`, `swipes`, `saved_memes`, and `user_statistics` tables, indexes, grants, and RLS settings.
2. **Seed starter memes** — the migrations include a curated starter set of clean English and Russian memes. Additional memes can be inserted directly into `public.memes`.
3. **Create a Storage bucket** (optional, for uploaded meme images):
   - Bucket name: `memes`
   - Set file size limits as needed (e.g. 10 MB)
   - Images are served through the `/api/public/meme-image/:id` proxy, so the bucket can remain private
4. **Verify grants** — every new table in the `public` schema must have explicit `GRANT` statements for the roles that access it (`authenticated`, `service_role`, etc.).

---

## Deployment Instructions

### Deploy with Lovable

1. Click the **Publish** button in the Lovable editor.
2. **Frontend changes** (UI, styling, client code) require clicking **Update** in the publish dialog to go live.
3. **Backend changes** (database migrations, server routes, server functions) deploy automatically and immediately.
4. Share a temporary preview via **Share → Share preview** (public, 7-day link) or publish to the permanent production URL.

### Production hosting (self-hosting)

The project is built on TanStack Start and can be self-hosted. See the [Lovable self-hosting guide](https://docs.lovable.dev/tips-and-tricks/self-hosting) for manual setup instructions.

---

## License

This project was built with [Lovable](https://lovable.dev). The code is yours to modify, deploy, and distribute as you see fit.
