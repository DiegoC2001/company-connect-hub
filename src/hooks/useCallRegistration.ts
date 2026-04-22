import { supabase } from "@/integrations/supabase/client";

export async function registrarChamada(input: {
  remetente_id: string;
  destinatario_id: string;
  empresa_id: string;
}) {
  const { data, error } = await supabase
    .from("chamadas")
    .insert({
      remetente_id: input.remetente_id,
      destinatario_id: input.destinatario_id,
      empresa_id: input.empresa_id,
      status: "em_andamento",
      duracao_segundos: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function finalizarChamada(
  callId: string,
  status: "completada" | "perdida" | "rejeitada",
  duracaoSegundos: number,
) {
  const { error } = await supabase
    .from("chamadas")
    .update({
      status,
      duracao_segundos: duracaoSegundos,
      finalizada_em: new Date().toISOString(),
    })
    .eq("id", callId);
  if (error) throw error;
}