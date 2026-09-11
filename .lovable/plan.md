# Polish the Meme Tinder swipe experience

## What will change
- Rebuild the main swipe surface around the selected modern depth-stack direction while preserving the existing dark coral/lime identity.
- Make pointer and touch dragging feel smoother, with progressive rotation, LIKE/NOPE stamps, reliable release behavior, and a clear next-card depth effect.
- Add polished Like, Dislike, and Save controls with hover, press, focus, disabled, and saved states.
- Add keyboard controls: left arrow to dislike, right arrow to like, and `S` to toggle save.
- Replace the basic placeholders with stable loading, retryable error, and finished-deck states. The finished state will link to Matches and Saved and allow swipe history to reset in place.
- Tune sizing, touch behavior, and spacing for mobile without changing the other pages.

## Technical details
- Use the existing server functions and query cache; no database or API changes are needed.
- Reuse the existing design tokens and shared Button component.
- Add save/unsave and reset actions through the existing server functions.
- Respect reduced-motion preferences and prevent browser scrolling only during horizontal card interaction.
- Verify keyboard, button, drag, retry, saved-state, and reset flows at desktop and mobile sizes.
