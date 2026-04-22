import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, LogIn, Plus, Settings, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useEntrarSala, useSalas, type SalaComCriador } from "@/hooks/useSalas";
import { CriarSalaDialog } from "@/components/salas/CriarSalaDialog";
import { GerenciarSalaSheet } from "@/components/salas/GerenciarSalaSheet";

export const Route = createFileRoute("/_authenticated/salas")({
  component: SalasPage,
});

function SalasPage() {
  const { user, empresaId } = useAuth();
  const { data: salas, isLoading } = useSalas(empresaId);
  const entrar = useEntrarSala();
  const [criarOpen, setCriarOpen] = useState(false);
  const [salaGerenciar, setSalaGerenciar] = useState<SalaComCriador | null>(null);

  const handleEntrar = async (sala: SalaComCriador) => {
    if (!user) return;
    try {
      await entrar.mutateAsync({ sala, userId: user.id });
      toast.success(`Você entrou em "${sala.nome_sala}"`);
      // TODO: integrar com WebRTC real ao ingressar
    } catch (e) {
      toast.error("Falha ao entrar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Salas de Reunião"
        description="Crie e participe de salas de reunião com seus colegas."
        actions={
          <Button onClick={() => setCriarOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova sala
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !salas || salas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold">Nenhuma sala ativa</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crie sua primeira sala para começar uma reunião com colegas da empresa.
            </p>
            <Button className="mt-4" onClick={() => setCriarOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Criar sala
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salas.map((s) => {
            const participantes = (s.participantes as unknown as string[]) ?? [];
            const isParticipante = user ? participantes.includes(user.id) : false;
            const isCriador = s.criador_id === user?.id;
            return (
              <Card key={s.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold">{s.nome_sala}</h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        por {s.criador?.nome_completo ?? "—"}
                      </p>
                    </div>
                    <span className="relative flex h-2 w-2 shrink-0 items-center">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-status-online opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-status-online" />
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {participantes.length}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(s.data_criacao), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="mt-auto flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleEntrar(s)}
                      disabled={entrar.isPending}
                    >
                      {entrar.isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="mr-1.5 h-4 w-4" />
                      )}
                      {isParticipante ? "Entrar novamente" : "Entrar"}
                    </Button>
                    {isCriador && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSalaGerenciar(s)}
                        title="Gerenciar"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CriarSalaDialog
        open={criarOpen}
        onOpenChange={setCriarOpen}
        empresaId={empresaId}
        userId={user?.id ?? null}
      />
      <GerenciarSalaSheet
        open={!!salaGerenciar}
        onOpenChange={(v) => !v && setSalaGerenciar(null)}
        sala={salaGerenciar}
        empresaId={empresaId}
        userId={user?.id ?? null}
      />
    </div>
  );
}