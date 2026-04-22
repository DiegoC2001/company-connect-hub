import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChamadasTable } from "@/components/chamadas/ChamadasTable";
import { useAuth } from "@/contexts/AuthContext";
import { useChamadas, type ChamadaComContatos } from "@/hooks/useChamadas";
import type { Database } from "@/integrations/supabase/types";

type StatusFiltro = Database["public"]["Enums"]["status_chamada"] | "todos";
type DirecaoFiltro = "todas" | "recebidas" | "realizadas";
type PeriodoFiltro = "todos" | "hoje" | "7dias" | "30dias";

export const Route = createFileRoute("/_authenticated/chamadas")({
  component: ChamadasPage,
});

function ChamadasPage() {
  const { user, empresaId } = useAuth();
  const navigate = useNavigate();
  const { data: chamadas, isLoading } = useChamadas(empresaId);

  const [periodo, setPeriodo] = useState<PeriodoFiltro>("todos");
  const [direcao, setDirecao] = useState<DirecaoFiltro>("todas");
  const [status, setStatus] = useState<StatusFiltro>("todos");

  const filtradas = useMemo(() => {
    if (!chamadas) return [];
    const agora = Date.now();
    const cutoff =
      periodo === "hoje"
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : periodo === "7dias"
          ? agora - 7 * 86400_000
          : periodo === "30dias"
            ? agora - 30 * 86400_000
            : 0;

    return chamadas.filter((c) => {
      if (cutoff && new Date(c.iniciada_em).getTime() < cutoff) return false;
      if (status !== "todos" && c.status !== status) return false;
      if (direcao === "recebidas" && c.destinatario_id !== user?.id) return false;
      if (direcao === "realizadas" && c.remetente_id !== user?.id) return false;
      return true;
    });
  }, [chamadas, periodo, direcao, status, user?.id]);

  const handleRecall = (c: ChamadaComContatos) => {
    const contato = c.destinatario_id === user?.id ? c.remetente : c.destinatario;
    toast("Abrindo Contatos para rechamar", {
      description: contato?.nome_completo,
    });
    void navigate({ to: "/contatos" });
  };

  const hasFiltros = periodo !== "todos" || direcao !== "todas" || status !== "todos";

  return (
    <div>
      <PageHeader
        title="Chamadas Recentes"
        description="Histórico de chamadas de voz e vídeo realizadas e recebidas."
      />
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo o período</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Select value={direcao} onValueChange={(v) => setDirecao(v as DirecaoFiltro)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas direções</SelectItem>
                <SelectItem value="recebidas">Recebidas</SelectItem>
                <SelectItem value="realizadas">Realizadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFiltro)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
            {hasFiltros && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPeriodo("todos");
                  setDirecao("todas");
                  setStatus("todos");
                }}
              >
                <X className="mr-1 h-4 w-4" /> Limpar
              </Button>
            )}
          </div>

          <ChamadasTable
            chamadas={filtradas}
            loading={isLoading}
            currentUserId={user?.id ?? null}
            onRecall={handleRecall}
          />
        </CardContent>
      </Card>
    </div>
  );
}