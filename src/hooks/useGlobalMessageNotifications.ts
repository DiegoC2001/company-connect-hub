import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Mensagem = Database["public"]["Tables"]["mensagens_chat"]["Row"];

export function useGlobalMessageNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`user:${user.id}:mensagens`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_chat",
          filter: `destinatario_id=eq.${user.id}`,
        },
        async (payload) => {
          const msg = payload.new as Mensagem;
          // Buscar nome do remetente
          const { data: remetente } = await supabase
            .from("funcionarios")
            .select("nome_completo")
            .eq("id", msg.remetente_id)
            .maybeSingle();
          toast(remetente?.nome_completo ?? "Nova mensagem", {
            description: msg.conteudo.slice(0, 80),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);
}