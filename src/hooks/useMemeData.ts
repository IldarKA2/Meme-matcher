import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getDeviceId } from "@/lib/device";
import {
  getLikedMemes,
  getMatchingUsers,
  getRandomMeme,
  getSavedMemes,
  getUserStatistics,
} from "@/lib/meme.functions";

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);
  return deviceId;
}

const EMPTY_STATS = {
  total_swipes: 0,
  likes_count: 0,
  dislikes_count: 0,
  saves_count: 0,
  top_category: null as string | null,
  updated_at: "",
};

/** Invalidate everything that changes after a swipe/save. */
export function useRefreshMemeData(deviceId: string) {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ["deck", "saved", "stats", "liked", "matches"]) {
      void queryClient.invalidateQueries({ queryKey: [key, deviceId] });
    }
  };
}

export function useDeck() {
  const deviceId = useDeviceId();
  const query = useQuery({
    queryKey: ["deck", deviceId],
    queryFn: () => getRandomMeme({ data: { deviceId, count: 3 } }),
    enabled: Boolean(deviceId),
  });
  return {
    deviceId,
    deck: query.data?.memes ?? [],
    remaining: query.data?.remaining ?? 0,
    exhausted: Boolean(query.data?.exhausted),
    isLoading: !deviceId || query.isLoading,
    error: query.error,
  };
}

export function useSavedMemes() {
  const deviceId = useDeviceId();
  const query = useQuery({
    queryKey: ["saved", deviceId],
    queryFn: () => getSavedMemes({ data: { deviceId } }),
    enabled: Boolean(deviceId),
  });
  return {
    deviceId,
    saved: query.data?.memes ?? [],
    isLoading: !deviceId || query.isLoading,
    error: query.error,
  };
}

export function useStatistics() {
  const deviceId = useDeviceId();
  const query = useQuery({
    queryKey: ["stats", deviceId],
    queryFn: () => getUserStatistics({ data: { deviceId } }),
    enabled: Boolean(deviceId),
  });
  return {
    deviceId,
    stats: query.data?.statistics ?? EMPTY_STATS,
    isLoading: !deviceId || query.isLoading,
    error: query.error,
  };
}

export function useLikedMemes() {
  const deviceId = useDeviceId();
  const query = useQuery({
    queryKey: ["liked", deviceId],
    queryFn: () => getLikedMemes({ data: { deviceId } }),
    enabled: Boolean(deviceId),
  });
  return {
    deviceId,
    liked: query.data?.memes ?? [],
    isLoading: !deviceId || query.isLoading,
    error: query.error,
  };
}

export function useMatchingUsers(enabled: boolean) {
  const deviceId = useDeviceId();
  const query = useQuery({
    queryKey: ["matches", deviceId],
    queryFn: () => getMatchingUsers({ data: { deviceId } }),
    enabled: Boolean(deviceId) && enabled,
  });
  return { users: query.data?.users ?? [], isLoading: query.isLoading };
}
