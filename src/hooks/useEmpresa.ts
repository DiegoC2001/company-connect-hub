import { useQuery } from "@tanstack/react-query";
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
