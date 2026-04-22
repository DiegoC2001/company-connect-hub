import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useFuncionarios, type Funcionario } from "@/hooks/useFuncionarios";
import { ContatosFilters } from "@/components/contatos/ContatosFilters";
import { ContatosTable } from "@/components/contatos/ContatosTable";
import { ChatSheet } from "@/components/contatos/ChatSheet";
import { useStartCall } from "@/components/contatos/CallDialog";
import { useDebounce } from "@/hooks/useDebounce";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["status_presenca"] | "todos";

export const Route = createFileRoute("/_authenticated/contatos")({
  component: ContatosPage,
});

function ContatosPage() {
  const { user, empresaId } = useAuth();
  const { data: funcionarios, isLoading } = useFuncionarios(empresaId, user?.id ?? null);
  const { initCall, isBusy } = useStartCall();

  const [busca, setBusca] = useState("");
  const debouncedBusca = useDebounce(busca, 500);
  const [departamento, setDepartamento] = useState("todos");
  const [status, setStatus] = useState<Status>("todos");

  const [chatContato, setChatContato] = useState<Funcionario | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const departamentos = useMemo(() => {
    const set = new Set<string>();
    funcionarios?.forEach((f) => f.departamento && set.add(f.departamento));
    return Array.from(set).sort();
  }, [funcionarios]);

  const filtrados = useMemo(() => {
    if (!funcionarios) return [];
    const q = debouncedBusca.trim().toLowerCase();
    return funcionarios.filter((f) => {
      if (q && !f.nome_completo.toLowerCase().includes(q)) return false;
      if (departamento !== "todos" && f.departamento !== departamento) return false;
      if (status !== "todos" && f.status_presenca !== status) return false;
      return true;
    });
  }, [funcionarios, debouncedBusca, departamento, status]);

  const handleCall = (f: Funcionario, tipo: "voz" | "video") => {
    if (isBusy) {
      toast.warning("Você já está em uma chamada");
      return;
    }
    void initCall(f, tipo);
  };

  const handleMessage = (f: Funcionario) => {
    setChatContato(f);
    setChatOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Contatos da Empresa"
        description="Veja colegas, status de presença e inicie chamadas ou conversas."
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <ContatosFilters
            busca={busca}
            setBusca={setBusca}
            departamento={departamento}
            setDepartamento={setDepartamento}
            status={status}
            setStatus={setStatus}
            departamentos={departamentos}
            onLimpar={() => {
              setBusca("");
              setDepartamento("todos");
              setStatus("todos");
            }}
          />
          <ContatosTable
            funcionarios={filtrados}
            loading={isLoading}
            onCall={handleCall}
            onMessage={handleMessage}
          />
        </CardContent>
      </Card>

      <ChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        contato={chatContato}
        userId={user?.id ?? null}
        empresaId={empresaId}
      />
    </div>
  );
}