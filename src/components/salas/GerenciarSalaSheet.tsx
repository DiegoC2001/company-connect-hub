import { useMemo } from "react";
import { Loader2, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useAtualizarSala, type SalaComCriador } from "@/hooks/useSalas";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sala: SalaComCriador | null;
  empresaId: string | null;
  userId: string | null;
}

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export function GerenciarSalaSheet({ open, onOpenChange, sala, empresaId, userId }: Props) {
  const { data: funcionarios } = useFuncionarios(empresaId, null);
  const atualizar = useAtualizarSala();

  const participantesIds = useMemo(
    () => (sala?.participantes as unknown as string[]) ?? [],
    [sala],
  );

  const participantes = useMemo(() => {
    if (!funcionarios) return [];
    return participantesIds
      .map((id) => funcionarios.find((f) => f.id === id))
      .filter(Boolean) as NonNullable<typeof funcionarios>;
  }, [funcionarios, participantesIds]);

  const isCriador = sala?.criador_id === userId;

  const removerParticipante = async (id: string) => {
    if (!sala) return;
    try {
      await atualizar.mutateAsync({
        id: sala.id,
        participantes: participantesIds.filter((p) => p !== id),
      });
      toast.success("Participante removido");
    } catch (e) {
      toast.error("Falha ao remover", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const encerrar = async () => {
    if (!sala) return;
    try {
      await atualizar.mutateAsync({ id: sala.id, ativa: false });
      toast.success("Sala encerrada");
      onOpenChange(false);
    } catch (e) {
      toast.error("Falha ao encerrar sala", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{sala?.nome_sala ?? "Gerenciar sala"}</SheetTitle>
          <SheetDescription>Criada por {sala?.criador?.nome_completo ?? "—"}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Participantes ({participantes.length})
          </div>
          <div className="space-y-1">
            {participantes.length === 0 && (
              <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                Sem participantes ainda.
              </div>
            )}
            {participantes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border bg-card p-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.nome_completo} />}
                    <AvatarFallback>{iniciais(p.nome_completo)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {p.nome_completo}
                      {p.id === sala?.criador_id && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(criador)</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.cargo ?? p.email}
                    </div>
                  </div>
                </div>
                {isCriador && p.id !== sala?.criador_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removerParticipante(p.id)}
                    disabled={atualizar.isPending}
                    title="Remover"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2 border-t pt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {isCriador && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={encerrar}
              disabled={atualizar.isPending}
            >
              {atualizar.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Encerrar sala
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
