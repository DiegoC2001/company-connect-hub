import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { PhoneCall, MessageSquare, Users, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const stats = [
  { label: "Chamadas hoje", value: "—", icon: PhoneCall },
  { label: "Mensagens não lidas", value: "—", icon: MessageSquare },
  { label: "Contatos online", value: "—", icon: Users },
  { label: "Salas ativas", value: "—", icon: Video },
];

function DashboardPage() {
  const { funcionario } = useAuth();
  return (
    <div>
      <PageHeader
        title={`Olá, ${funcionario?.nome_completo?.split(" ")[0] ?? ""}`}
        description="Visão geral da sua comunicação corporativa."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Atividade recente</CardTitle>
          <CardDescription>Em breve: timeline de chamadas e mensagens.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhuma atividade ainda.
        </CardContent>
      </Card>
    </div>
  );
}