export type Meme = {
  id: string;
  template: string;
  lines: string[];
  language: string;
  category: string;
};

export type UserStatistics = {
  total_swipes: number;
  likes_count: number;
  dislikes_count: number;
  saves_count: number;
  top_category: string | null;
  updated_at: string;
};

export type MatchingUser = {
  device_id: string;
  shared_likes: number;
  compatibility: number;
  top_category: string | null;
  likes_count: number;
};

/**
 * Pre-rendered meme image, served by our own server route which proxies the
 * external image service. No third-party call happens in the browser.
 */
export function memeImageUrl(meme: Meme, width = 600) {
  return `/api/public/meme-image/${meme.id}?width=${width}`;
}

export {
  getRandomMeme,
  recordSwipe,
  saveMeme,
  unsaveMeme,
  getSavedMemes,
  getUserStatistics,
  getLikedMemes,
  getMatchingUsers,
  resetHistory,
} from "./meme.functions";
