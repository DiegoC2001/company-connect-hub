import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Sala = Database["public"]["Tables"]["salas_reuniao"]["Row"];
export type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"];

export interface SalaComCriador extends Sala {
  criador: Funcionario | null;
}

export function useSalas(empresaId: string | null) {
  const qc = useQueryClient();
  const queryKey = ["salas", empresaId];

  const query = useQuery({
    queryKey,
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salas_reuniao")
        .select("*, criador:funcionarios!salas_reuniao_criador_id_fkey(*)")
        .eq("ativa", true)
        .order("data_criacao", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SalaComCriador[];
    },
  });

  useEffect(() => {
    if (!empresaId) return;
    const channel = supabase
      .channel(`empresa:${empresaId}:salas`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "salas_reuniao",
          filter: `empresa_id=eq.${empresaId}`,
        },
        () => void qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  return query;
}

export function useCriarSala() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      nome_sala: string;
      empresa_id: string;
      criador_id: string;
      participantes: string[];
    }) => {
      const { data, error } = await supabase
        .from("salas_reuniao")
        .insert({
          nome_sala: input.nome_sala,
          empresa_id: input.empresa_id,
          criador_id: input.criador_id,
          participantes: input.participantes,
          ativa: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["salas"] }),
  });
}

export function useAtualizarSala() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      participantes?: string[];
      ativa?: boolean;
      nome_sala?: string;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("salas_reuniao").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["salas"] }),
  });
}

export function useEntrarSala() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sala: SalaComCriador; userId: string }) => {
      const atuais = (input.sala.participantes as unknown as string[]) ?? [];
      if (atuais.includes(input.userId)) return;
      const { error } = await supabase
        .from("salas_reuniao")
        .update({ participantes: [...atuais, input.userId] })
        .eq("id", input.sala.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["salas"] }),
  });
}
