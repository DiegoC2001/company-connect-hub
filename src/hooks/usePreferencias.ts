import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type StatusPresenca = Database["public"]["Enums"]["status_presenca"];
export type QualidadeVideo = "auto" | "alta" | "media";

export interface Preferencias {
  status_padrao: StatusPresenca;
  notif_chamada_perdida: boolean;
  qualidade_video: QualidadeVideo;
  nao_perturbe: boolean;
}

const DEFAULTS: Preferencias = {
  status_padrao: "online",
  notif_chamada_perdida: true,
  qualidade_video: "auto",
  nao_perturbe: false,
};

export function usePreferencias(userId: string | null) {
  const qc = useQueryClient();
  const queryKey = ["preferencias", userId];

  const query = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async (): Promise<Preferencias> => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("status_padrao, notif_chamada_perdida, qualidade_video, nao_perturbe")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULTS;
      return {
        status_padrao: data.status_padrao,
        notif_chamada_perdida: data.notif_chamada_perdida,
        qualidade_video: data.qualidade_video as QualidadeVideo,
        nao_perturbe: data.nao_perturbe,
      };
    },
  });

  const upsert = useMutation({
    mutationFn: async (patch: Preferencias) => {
      if (!userId) throw new Error("Sem usuário");
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.setQueryData(queryKey, vars);
    },
  });

  return { ...query, save: upsert.mutateAsync, isSaving: upsert.isPending };
}

/** Local debounced state synced to backend. */
export function useDebouncedPrefs(
  remote: Preferencias | undefined,
  save: (p: Preferencias) => Promise<void>,
  delay = 600,
) {
  const [local, setLocal] = useState<Preferencias | undefined>(remote);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");

  useEffect(() => {
    if (remote && !local) {
      setLocal(remote);
      lastSaved.current = JSON.stringify(remote);
    }
  }, [remote, local]);

  useEffect(() => {
    if (!local) return;
    const serialized = JSON.stringify(local);
    if (serialized === lastSaved.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastSaved.current = serialized;
      void save(local);
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [local, save, delay]);

  return [local, setLocal] as const;
}
