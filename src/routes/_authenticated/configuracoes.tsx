import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { funcionario } = useAuth();
  return (
    <div>
      <PageHeader title="Configurações" description="Gerencie seu perfil e preferências." />
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Suas informações na empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Nome:</span> {funcionario?.nome_completo}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span> {funcionario?.email}
          </div>
          <div>
            <span className="text-muted-foreground">Cargo:</span> {funcionario?.cargo ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Departamento:</span>{" "}
            {funcionario?.departamento ?? "—"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
