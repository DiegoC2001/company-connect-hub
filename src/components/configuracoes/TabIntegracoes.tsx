import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegracaoCard } from "./IntegracaoCard";

export function TabIntegracoes() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrações externas</CardTitle>
          <CardDescription>
            Conecte serviços para enriquecer o cloudphone. As integrações abaixo são visuais — em
            breve serão persistidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <IntegracaoCard
            nome="CRM"
            descricao="Sincronize contatos e oportunidades."
            status="desconectado"
          />
          <IntegracaoCard
            nome="Email"
            descricao="Envio de emails transacionais."
            status="conectado"
          />
          <IntegracaoCard
            nome="Agendamento"
            descricao="Calendários e reuniões automáticas."
            status="configurar"
          />
        </CardContent>
      </Card>
    </div>
  );
}
