import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"];

export function useFuncionarios(empresaId: string | null, currentUserId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["funcionarios", empresaId];

  const query = useQuery({
    queryKey,
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("empresa_id", empresaId!)
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return (data ?? []).filter((f) => f.id !== currentUserId);
    },
  });

  // Realtime de presença
  useEffect(() => {
    if (!empresaId) return;
    const channel = supabase
      .channel(`empresa:${empresaId}:presenca`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "funcionarios",
          filter: `empresa_id=eq.${empresaId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  return query;
}
