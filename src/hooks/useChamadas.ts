import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Chamada = Database["public"]["Tables"]["chamadas"]["Row"];
export type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"];

export interface ChamadaComContatos extends Chamada {
  remetente: Funcionario | null;
  destinatario: Funcionario | null;
}

export function useChamadas(empresaId: string | null) {
  return useQuery({
    queryKey: ["chamadas", empresaId],
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
}
