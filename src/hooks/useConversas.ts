import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface Conversa {
  outro_usuario_id: string;
  outro_usuario_nome: string;
  outro_usuario_avatar: string | null;
  ultima_mensagem: string;
  data_ultima_mensagem: string;
  nao_lidas: number;
}

export function useConversas(userId: string | null) {
  return useQuery({
    queryKey: ["conversas", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Fetch messages where the user is sender or receiver
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select(`
          *,
          remetente:funcionarios!mensagens_chat_remetente_id_fkey(id, nome_completo, avatar_url),
          destinatario:funcionarios!mensagens_chat_destinatario_id_fkey(id, nome_completo, avatar_url)
        `)
        .or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`)
        .order("data_envio", { ascending: false });

      if (error) throw error;

      const conversasMap = new Map<string, Conversa>();

      data?.forEach((msg) => {
        const isRemetente = msg.remetente_id === userId;
        const outroUser = isRemetente ? msg.destinatario : msg.remetente;
        
        if (!outroUser) return;

        const outroId = outroUser.id;

        if (!conversasMap.has(outroId)) {
          conversasMap.set(outroId, {
            outro_usuario_id: outroId,
            outro_usuario_nome: outroUser.nome_completo,
            outro_usuario_avatar: outroUser.avatar_url,
            ultima_mensagem: msg.conteudo,
            data_ultima_mensagem: msg.data_envio,
            nao_lidas: 0,
          });
        }

        if (!isRemetente && !msg.lida) {
          const c = conversasMap.get(outroId)!;
          c.nao_lidas += 1;
        }
      });

      return Array.from(conversasMap.values());
    },
  });
}
