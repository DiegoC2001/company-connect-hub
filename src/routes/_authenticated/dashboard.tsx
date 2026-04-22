import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { PhoneCall, MessageSquare, Users, Video, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, funcionario, empresaId } = useAuth();
  const { data: stats, isLoading } = useDashboardStats(user?.id ?? null, empresaId);

  const statsItems = [
    { 
      label: "Chamadas hoje", 
      value: stats?.chamadasHoje ?? 0, 
      icon: PhoneCall,
      color: "text-blue-500"
    },
    { 
      label: "Mensagens não lidas", 
      value: stats?.mensagensNaoLidas ?? 0, 
      icon: MessageSquare,
      color: "text-green-500"
    },
    { 
      label: "Contatos online", 
      value: stats?.contatosOnline ?? 0, 
      icon: Users,
      color: "text-orange-500"
    },
    { 
      label: "Salas ativas", 
      value: stats?.salasAtivas ?? 0, 
      icon: Video,
      color: "text-purple-500"
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${funcionario?.nome_completo?.split(" ")[0] ?? ""}`}
        description="Visão geral da sua comunicação corporativa."
      />
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsItems.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{s.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Atividade recente</CardTitle>
          <CardDescription>Resumo das últimas interações no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-10 text-center">
          As atividades recentes aparecerão aqui conforme você interage com o sistema.
        </CardContent>
      </Card>
    </div>
  );
}