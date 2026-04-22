import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTotalUnreadMessages(userId: string | null) {
  return useQuery({
    queryKey: ["unread-messages-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("mensagens_chat")
        .select("*", { count: "exact", head: true })
        .eq("destinatario_id", userId)
        .eq("lida", false);

      if (error) throw error;
      return count || 0;
    },
  });
}
