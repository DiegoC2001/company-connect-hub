import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { TabPerfil } from "@/components/configuracoes/TabPerfil";
import { TabPreferencias } from "@/components/configuracoes/TabPreferencias";
import { TabIntegracoes } from "@/components/configuracoes/TabIntegracoes";
import { TabEmpresa } from "@/components/configuracoes/TabEmpresa";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie seu perfil, preferências e a empresa."
      />

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          {isAdmin && <TabsTrigger value="integracoes">Integrações</TabsTrigger>}
          {isAdmin && <TabsTrigger value="empresa">Empresa</TabsTrigger>}
        </TabsList>

        <TabsContent value="perfil">
          <TabPerfil />
        </TabsContent>
        <TabsContent value="preferencias">
          <TabPreferencias />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="integracoes">
            <TabIntegracoes />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="empresa">
            <TabEmpresa />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
