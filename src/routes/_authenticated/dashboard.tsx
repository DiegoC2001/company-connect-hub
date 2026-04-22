import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { PhoneCall, MessageSquare, Users, Video, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAtividadeRecente } from "@/hooks/useAtividadeRecente";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, funcionario, empresaId } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(user?.id ?? null, empresaId);
  const { data: atividades, isLoading: atividadesLoading } = useAtividadeRecente(user?.id ?? null, empresaId);

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
              {statsLoading ? (
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
        <CardContent>
          {atividadesLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : atividades && atividades.length > 0 ? (
            <div className="space-y-4">
              {atividades.map((a) => (
                <div key={a.id} className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div className="rounded-full bg-muted p-2">
                    {a.tipo === "chamada" ? <PhoneCall className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{a.subtitulo}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(a.data), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-10 text-center">
              As atividades recentes aparecerão aqui conforme você interage com o sistema.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}