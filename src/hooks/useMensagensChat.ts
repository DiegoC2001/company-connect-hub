import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Mensagem = Database["public"]["Tables"]["mensagens_chat"]["Row"];

export function useMensagensChat(
  userId: string | null,
  contatoId: string | null,
  empresaId: string | null,
) {
  const [isOutroDigitando, setIsOutroDigitando] = useState(false);
  const typingChannelRef = useRef<any>(null);
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
  }, [userId, contatoId, queryClient, queryKey]);

  // Typing Indicator Realtime
  useEffect(() => {
    if (!userId || !contatoId) return;

    // Use a shared channel for both users by sorting their IDs
    const roomKey = [userId, contatoId].sort().join(":");
    const channel = supabase.channel(`typing:${roomKey}`);

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        // Only update if the typing event is from the other user
        if (payload.userId === contatoId) {
          setIsOutroDigitando(payload.isTyping);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, contatoId]);

  const setTyping = (isTyping: boolean) => {
    if (typingChannelRef.current && userId) {
      void typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId, isTyping },
      });
    }
  };

  const sendMutation = useMutation({
    mutationFn: async ({
      conteudo,
      arquivo_url,
      tipo_arquivo,
    }: {
      conteudo: string;
      arquivo_url?: string;
      tipo_arquivo?: string;
    }) => {
      if (!userId || !contatoId || !empresaId) throw new Error("Dados ausentes");
      const { data, error } = await supabase
        .from("mensagens_chat")
        .insert({
          remetente_id: userId,
          destinatario_id: contatoId,
          empresa_id: empresaId,
          conteudo,
          arquivo_url,
          tipo_arquivo,
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

  return {
    ...query,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    isOutroDigitando,
    setTyping,
  };
}