import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEmpresa(empresaId: string | null) {
  return useQuery({
    queryKey: ["empresa", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", empresaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAtualizarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      nome?: string;
      dominio_email?: string;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("empresas").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["empresa", variables.id] });
    },
  });
}