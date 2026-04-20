import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type IntegracaoStatus = "conectado" | "desconectado" | "configurar";

const STATUS_META: Record<
  IntegracaoStatus,
  { label: string; className: string; cta: string }
> = {
  conectado: {
    label: "Conectado",
    className: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20",
    cta: "Gerenciar",
  },
  desconectado: {
    label: "Desconectado",
    className: "bg-destructive/15 text-destructive hover:bg-destructive/20",
    cta: "Conectar",
  },
  configurar: {
    label: "Configurar",
    className: "bg-amber-500/15 text-amber-600 hover:bg-amber-500/20",
    cta: "Configurar",
  },
};

interface Props {
  nome: string;
  descricao: string;
  status: IntegracaoStatus;
}

export function IntegracaoCard({ nome, descricao, status }: Props) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [testing, setTesting] = useState(false);
  const meta = STATUS_META[status];

  // TODO: persistir credenciais quando criarmos a tabela `integracoes_empresa`.
  function handleTest() {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success(`${nome}: conexão OK`, {
        description: "Simulação — ainda não persistido.",
      });
    }, 800);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{nome}</CardTitle>
            <CardDescription>{descricao}</CardDescription>
          </div>
          <Badge variant="secondary" className={meta.className}>
            {meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {meta.cta}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar {nome}</DialogTitle>
              <DialogDescription>
                Informe as credenciais e teste a conexão.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_..."
                />
              </div>
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.exemplo.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !apiKey || !endpoint}
              >
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Testar conexão
              </Button>
              <Button onClick={() => setOpen(false)} disabled={!apiKey || !endpoint}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
