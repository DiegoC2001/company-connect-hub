import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MensagemSala {
  id: string;
  sala_id: string;
  remetente_id: string;
  empresa_id: string;
  conteudo: string;
  data_envio: string;
  arquivo_url?: string;
  tipo_arquivo?: string;
  remetente?: {
    nome_completo: string;
    avatar_url: string | null;
  };
}

export function useMensagensSala(salaId: string | null, userId: string | null, empresaId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["mensagens-sala", salaId];

  const query = useQuery({
    queryKey,
    enabled: !!salaId && !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens_sala")
        .select(`
          *,
          remetente:funcionarios(nome_completo, avatar_url)
        `)
        .eq("sala_id", salaId!)
        .order("data_envio", { ascending: true });
      
      if (error) throw error;
      return data as MensagemSala[];
    },
  });

  // Realtime
  useEffect(() => {
    if (!salaId) return;

    const channel = supabase
      .channel(`room-chat:${salaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_sala",
          filter: `sala_id=eq.${salaId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [salaId, queryClient, queryKey]);

  const sendMutation = useMutation({
    mutationFn: async (conteudo: string) => {
      if (!userId || !salaId || !empresaId) throw new Error("Dados ausentes");
      
      const { data, error } = await supabase
        .from("mensagens_sala")
        .insert({
          sala_id: salaId,
          remetente_id: userId,
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

  return {
    ...query,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}
