import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/chamadas")({
  component: ChamadasPage,
});

function ChamadasPage() {
  return (
    <div>
      <PageHeader title="Chamadas Recentes" description="Histórico de chamadas feitas e recebidas." />
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Em breve: filtros por data, status e participante.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sem chamadas registradas ainda.
        </CardContent>
      </Card>
    </div>
  );
}
