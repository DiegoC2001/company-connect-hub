import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"];

export interface FuncionarioComRole extends Funcionario {
  is_admin: boolean;
}

export function useUsuarios(empresaId: string | null) {
  return useQuery({
    queryKey: ["usuarios", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data: funcionarios, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("empresa_id", empresaId!)
        .order("nome_completo");
      if (error) throw error;

      const ids = (funcionarios ?? []).map((f) => f.id);
      const roleMap = new Map<string, boolean>();
      if (ids.length) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids);
        (roles ?? []).forEach((r) => {
          if (r.role === "admin") roleMap.set(r.user_id, true);
        });
      }
      return (funcionarios ?? []).map((f) => ({
        ...f,
        is_admin: roleMap.get(f.id) ?? false,
      })) as FuncionarioComRole[];
    },
  });
}

export function useAtualizarFuncionario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      nome_completo?: string;
      cargo?: string | null;
      departamento?: string | null;
      ativo?: boolean;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("funcionarios").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}
