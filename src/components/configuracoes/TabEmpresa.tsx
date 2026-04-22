import { useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/hooks/useEmpresa";

export function TabEmpresa() {
  const { empresaId } = useAuth();
  const { data: empresa, isLoading } = useEmpresa(empresaId);

  const [nome, setNome] = useState("");
  const [dominio, setDominio] = useState("");
  const [sessao, setSessao] = useState([60]);
  const [senhaForte, setSenhaForte] = useState(true);

  // sincroniza valores quando carregar
  if (empresa && !nome && !dominio) {
    setNome(empresa.nome);
    setDominio(empresa.dominio_email);
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  // TODO: persistir mudanças em `empresas` e em uma futura tabela de políticas.
  function handleSave() {
    toast.info("Em breve", { description: "Persistência de empresa será habilitada." });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
          <CardDescription>Informações exibidas para sua equipe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Domínio de email</Label>
              <Input value={dominio} onChange={(e) => setDominio(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave}>Salvar dados</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Plano de assinatura</CardTitle>
                <CardDescription>Plano atual da empresa.</CardDescription>
              </div>
              <Badge variant="secondary" className="capitalize">
                {empresa?.plano ?? "free"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Faça upgrade para liberar mais salas, gravações e relatórios avançados.
            </p>
            <Button variant="default" disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              Fazer upgrade (em breve)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios de uso</CardTitle>
            <CardDescription>Exportar atividade da empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV (em breve)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Políticas de segurança</CardTitle>
          <CardDescription>Aplicadas a todos os funcionários.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tempo limite de sessão</Label>
              <span className="text-sm font-medium">{sessao[0]} min</span>
            </div>
            <Slider value={sessao} onValueChange={setSessao} min={15} max={240} step={15} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Exigir senha forte</p>
              <p className="text-sm text-muted-foreground">
                Mínimo 8 caracteres, com letras e números.
              </p>
            </div>
            <Switch checked={senhaForte} onCheckedChange={setSenhaForte} />
          </div>

          <Button onClick={handleSave} variant="secondary">
            Aplicar políticas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}