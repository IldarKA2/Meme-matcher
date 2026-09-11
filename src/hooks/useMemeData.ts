import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getDeviceId } from "@/lib/device";
import { fetchMemes, fetchSaved, fetchSwipes } from "@/lib/meme-api";

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);
  return deviceId;
}

export function useMemeData() {
  const deviceId = useDeviceId();

  const memes = useQuery({ queryKey: ["memes"], queryFn: fetchMemes });
  const swipes = useQuery({
    queryKey: ["swipes", deviceId],
    queryFn: () => fetchSwipes(deviceId),
    enabled: Boolean(deviceId),
  });
  const saved = useQuery({
    queryKey: ["saved", deviceId],
    queryFn: () => fetchSaved(deviceId),
    enabled: Boolean(deviceId),
  });

  return {
    deviceId,
    memes: memes.data ?? [],
    swipes: swipes.data ?? [],
    saved: saved.data ?? [],
    isLoading: memes.isLoading || !deviceId || swipes.isLoading || saved.isLoading,
    error: memes.error ?? swipes.error ?? saved.error,
  };
}
