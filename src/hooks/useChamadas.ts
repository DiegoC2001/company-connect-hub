import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Chamada = Database["public"]["Tables"]["chamadas"]["Row"];
export type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"];

export interface ChamadaComContatos extends Chamada {
  remetente: Funcionario | null;
  destinatario: Funcionario | null;
}

export function useChamadas(empresaId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["chamadas", empresaId];

  const query = useQuery({
    queryKey,
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamadas")
        .select(
          "*, remetente:funcionarios!chamadas_remetente_id_fkey(*), destinatario:funcionarios!chamadas_destinatario_id_fkey(*)",
        )
        .order("iniciada_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as ChamadaComContatos[];
    },
  });

  useEffect(() => {
    if (!empresaId) return;

    const channel = supabase
      .channel(`empresa:${empresaId}:chamadas`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chamadas",
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