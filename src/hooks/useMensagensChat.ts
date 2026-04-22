import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Mensagem = Database["public"]["Tables"]["mensagens_chat"]["Row"];

export function useMensagensChat(
  userId: string | null,
  contatoId: string | null,
  empresaId: string | null,
) {
  const queryClient = useQueryClient();
  const queryKey = ["mensagens", userId, contatoId];

  const query = useQuery({
    queryKey,
    enabled: !!userId && !!contatoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select("*")
        .or(
          `and(remetente_id.eq.${userId},destinatario_id.eq.${contatoId}),and(remetente_id.eq.${contatoId},destinatario_id.eq.${userId})`,
        )
        .order("data_envio", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Marcar como lida ao abrir
  useEffect(() => {
    if (!userId || !contatoId) return;
    void supabase
      .from("mensagens_chat")
      .update({ lida: true })
      .eq("destinatario_id", userId)
      .eq("remetente_id", contatoId)
      .eq("lida", false)
      .then();
  }, [userId, contatoId]);

  // Realtime: novas mensagens entre os dois
  useEffect(() => {
    if (!userId || !contatoId) return;
    const channel = supabase
      .channel(`user:${userId}:mensagens:${contatoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_chat",
          filter: `destinatario_id=eq.${userId}`,
        },
        (payload) => {
          const novo = payload.new as Mensagem;
          if (novo.remetente_id === contatoId) {
            void queryClient.invalidateQueries({ queryKey });
            // Marcar como lida imediatamente
            void supabase.from("mensagens_chat").update({ lida: true }).eq("id", novo.id).then();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, contatoId]);

  const sendMutation = useMutation({
    mutationFn: async (conteudo: string) => {
      if (!userId || !contatoId || !empresaId) throw new Error("Dados ausentes");
      const { data, error } = await supabase
        .from("mensagens_chat")
        .insert({
          remetente_id: userId,
          destinatario_id: contatoId,
          empresa_id: empresaId,
          conteudo,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return { ...query, sendMessage: sendMutation.mutateAsync, isSending: sendMutation.isPending };
}