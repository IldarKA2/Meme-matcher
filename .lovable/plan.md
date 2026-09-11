# Deterministic humor matching

## What will change
- Keep the matches page locked until the current browser has at least 10 persisted likes, with an exact progress bar and remaining-like count.
- Enforce the same 10-like requirement on the server so the matching results cannot be requested early.
- Compare the current user's liked meme IDs with every other user's liked meme IDs stored in PostgreSQL.
- Calculate exact Jaccard similarity: shared likes divided by the unique likes across both users, rounded to a whole percentage.
- Sort matches by similarity, then shared-like count, with stable ordering for ties.
- Return each match's shared meme records so the page can render real preview thumbnails.
- Show each match with a deterministic avatar, anonymous identifier, humor-match badge, shared-favorites count, and up to three shared meme previews.
- Add a polished no-matches state with actions to keep swiping or invite friends.

## Technical details
- Reuse the existing tables and server functions; no AI, machine-learning package, or schema change is needed.
- Run matching and unlock checks server-side against persisted likes.
- Return only plain serializable match and meme data to the browser.
- Verify locked, unlocked, sorting, score, and shared-preview behavior against database-backed test data.
