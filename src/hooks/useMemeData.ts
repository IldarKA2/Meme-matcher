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

type StatsData = { statistics: typeof EMPTY_STATS };

/**
 * Bump the cached statistics immediately so counters move on swipe/save
 * without waiting for the server round-trip. Returns a rollback function.
 */
export function useOptimisticStats(deviceId: string) {
  const queryClient = useQueryClient();
  return (delta: Partial<typeof EMPTY_STATS>) => {
    const key = ["stats", deviceId];
    const previous = queryClient.getQueryData<StatsData>(key);
    queryClient.setQueryData<StatsData>(key, (old) => {
      const base = old?.statistics ?? EMPTY_STATS;
      return {
        ...(old ?? {}),
        statistics: {
          ...base,
          total_swipes: base.total_swipes + (delta.total_swipes ?? 0),
          likes_count: base.likes_count + (delta.likes_count ?? 0),
          dislikes_count: base.dislikes_count + (delta.dislikes_count ?? 0),
          saves_count: base.saves_count + (delta.saves_count ?? 0),
        },
      };
    });
    return () => {
      if (previous) queryClient.setQueryData<StatsData>(key, previous);
    };
  };
}

export function useDeck() {
  const deviceId = useDeviceId();
  const query = useQuery({
    queryKey: ["deck", deviceId],
    queryFn: () => getRandomMeme({ data: { deviceId, count: 3 } }),
    enabled: Boolean(deviceId),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  return {
    deviceId,
    deck: query.data?.memes ?? [],
    remaining: query.data?.remaining ?? 0,
    exhausted: Boolean(query.data?.exhausted),
    isLoading: !deviceId || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    retry: query.refetch,
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
  return {
    users: query.data?.users ?? [],
    unlocked: query.data?.unlocked ?? false,
    currentLikes: query.data?.currentLikes ?? 0,
    likesRequired: query.data?.likesRequired ?? 10,
    isLoading: query.isLoading,
    error: query.error,
  };
}
