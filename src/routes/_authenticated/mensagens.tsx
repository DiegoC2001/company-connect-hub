import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/mensagens")({
  component: MensagensPage,
});

function MensagensPage() {
  return (
    <div>
      <PageHeader title="Mensagens" description="Conversas com colegas da empresa." />
      <Card>
        <CardHeader>
          <CardTitle>Conversas</CardTitle>
          <CardDescription>Em breve: chat em tempo real via Supabase Realtime.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Nenhuma conversa ainda.</CardContent>
      </Card>
    </div>
  );
}
