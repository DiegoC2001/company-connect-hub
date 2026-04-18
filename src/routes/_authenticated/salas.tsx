import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/salas")({
  component: SalasPage,
});

function SalasPage() {
  return (
    <div>
      <PageHeader title="Salas de Reunião" description="Crie e participe de reuniões em vídeo." />
      <Card>
        <CardHeader>
          <CardTitle>Salas ativas</CardTitle>
          <CardDescription>Em breve: criação e entrada em salas via WebRTC.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhuma sala ativa.
        </CardContent>
      </Card>
    </div>
  );
}
