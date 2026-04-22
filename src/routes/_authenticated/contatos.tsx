import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useFuncionarios, type Funcionario } from "@/hooks/useFuncionarios";
import { ContatosFilters } from "@/components/contatos/ContatosFilters";
import { ContatosTable } from "@/components/contatos/ContatosTable";
import { CallDialog } from "@/components/contatos/CallDialog";
import { ChatSheet } from "@/components/contatos/ChatSheet";
import { useDebounce } from "@/hooks/useDebounce";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["status_presenca"] | "todos";

export const Route = createFileRoute("/_authenticated/contatos")({
  component: ContatosPage,
});

function ContatosPage() {
  const { user, empresaId } = useAuth();
  const { data: funcionarios, isLoading } = useFuncionarios(empresaId, user?.id ?? null);

  const [busca, setBusca] = useState("");
  const debouncedBusca = useDebounce(busca, 500);
  const [departamento, setDepartamento] = useState("todos");
  const [status, setStatus] = useState<Status>("todos");

  const [callContato, setCallContato] = useState<Funcionario | null>(null);
  const [callTipo, setCallTipo] = useState<"voz" | "video">("voz");
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
    setCallTipo(tipo);
    setCallContato(f);
  };

  const handleMessage = (f: Funcionario) => {
    setChatContato(f);
    setChatOpen(true);
  };

  const handleLeaveMessage = () => {
    if (callContato) {
      setChatContato(callContato);
      setChatOpen(true);
    }
    setCallContato(null);
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

      <CallDialog
        open={!!callContato}
        contato={callContato}
        tipo={callTipo}
        onCancel={() => setCallContato(null)}
        onLeaveMessage={handleLeaveMessage}
      />
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