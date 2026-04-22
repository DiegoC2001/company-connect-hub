import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Atividade {
  id: string;
  tipo: "chamada" | "mensagem";
  titulo: string;
  subtitulo: string;
  data: string;
  icone: string;
}

export function useAtividadeRecente(userId: string | null, empresaId: string | null) {
  return useQuery({
    queryKey: ["atividade-recente", userId, empresaId],
    enabled: !!userId && !!empresaId,
    queryFn: async () => {
      if (!userId || !empresaId) return [];

      const [chamadas, mensagens] = await Promise.all([
        // Últimas chamadas da empresa que envolvem o usuário
        supabase
          .from("chamadas")
          .select(`
            *,
            remetente:funcionarios!chamadas_remetente_id_fkey(nome_completo),
            destinatario:funcionarios!chamadas_destinatario_id_fkey(nome_completo)
          `)
          .or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`)
          .order("iniciada_em", { ascending: false })
          .limit(5),
        
        // Últimas mensagens recebidas
        supabase
          .from("mensagens_chat")
          .select(`
            *,
            remetente:funcionarios!mensagens_chat_remetente_id_fkey(nome_completo)
          `)
          .eq("destinatario_id", userId)
          .order("data_envio", { ascending: false })
          .limit(5),
      ]);

      const atividades: Atividade[] = [];

      chamadas.data?.forEach((c) => {
        const isRemetente = c.remetente_id === userId;
        const outroNome = isRemetente ? c.destinatario?.nome_completo : c.remetente?.nome_completo;
        atividades.push({
          id: `chamada-${c.id}`,
          tipo: "chamada",
          titulo: isRemetente ? `Chamada para ${outroNome}` : `Chamada de ${outroNome}`,
          subtitulo: c.status === "completada" ? `Duração: ${c.duracao_segundos}s` : `Status: ${c.status}`,
          data: c.iniciada_em,
          icone: "phone",
        });
      });

      mensagens.data?.forEach((m) => {
        atividades.push({
          id: `msg-${m.id}`,
          tipo: "mensagem",
          titulo: `Mensagem de ${m.remetente?.nome_completo}`,
          subtitulo: m.conteudo.length > 50 ? m.conteudo.substring(0, 50) + "..." : m.conteudo,
          data: m.data_envio,
          icone: "message",
        });
      });

      // Ordenar por data
      return atividades.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);
    },
  });
}
