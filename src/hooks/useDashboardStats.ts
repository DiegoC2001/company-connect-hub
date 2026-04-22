import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats(userId: string | null, empresaId: string | null) {
  return useQuery({
    queryKey: ["dashboard-stats", userId, empresaId],
    enabled: !!userId && !!empresaId,
    queryFn: async () => {
      if (!userId || !empresaId) return {
        chamadasHoje: 0,
        mensagensNaoLidas: 0,
        contatosOnline: 0,
        salasAtivas: 0,
      };

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeIso = hoje.toISOString();

      const [chamadas, mensagens, contatos, salas] = await Promise.all([
        // Chamadas hoje
        supabase
          .from("chamadas")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .gte("iniciada_em", hojeIso),
        
        // Mensagens não lidas
        supabase
          .from("mensagens_chat")
          .select("id", { count: "exact", head: true })
          .eq("destinatario_id", userId)
          .eq("lida", false),
        
        // Contatos online
        supabase
          .from("funcionarios")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("status_presenca", "online"),
        
        // Salas ativas
        supabase
          .from("salas_reuniao")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", empresaId)
          .eq("ativa", true),
      ]);

      return {
        chamadasHoje: chamadas.count || 0,
        mensagensNaoLidas: mensagens.count || 0,
        contatosOnline: contatos.count || 0,
        salasAtivas: salas.count || 0,
      };
    },
  });
}
