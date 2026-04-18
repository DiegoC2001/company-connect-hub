import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/contatos")({
  component: ContatosPage,
});

function ContatosPage() {
  return (
    <div>
      <PageHeader
        title="Contatos da Empresa"
        description="Veja colegas, status de presença e inicie chamadas."
      />
      <Card>
        <CardHeader>
          <CardTitle>Lista de contatos</CardTitle>
          <CardDescription>Em breve: lista filtrável de funcionários.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Conteúdo será implementado na próxima etapa.
        </CardContent>
      </Card>
    </div>
  );
}
