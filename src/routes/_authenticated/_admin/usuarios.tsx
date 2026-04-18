import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/_admin/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  return (
    <div>
      <PageHeader
        title="Gerenciar Usuários"
        description="Administre funcionários, papéis e permissões."
      />
      <Card>
        <CardHeader>
          <CardTitle>Funcionários</CardTitle>
          <CardDescription>
            Em breve: convite, edição de papel (admin/funcionário) e desativação.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhum funcionário cadastrado além de você.
        </CardContent>
      </Card>
    </div>
  );
}
