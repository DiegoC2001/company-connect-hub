import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { inviteFuncionario } from "@/utils/admin.functions";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ConvidarUsuarioDialog({ open, onOpenChange }: Props) {
  const invite = useServerFn(inviteFuncionario);
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const reset = () => {
    setEmail("");
    setNome("");
    setCargo("");
    setDepartamento("");
    setIsAdmin(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nome.trim()) return;
    setLoading(true);
    try {
      await invite({
        data: {
          email: email.trim(),
          nomeCompleto: nome.trim(),
          cargo: cargo.trim() || null,
          departamento: departamento.trim() || null,
          isAdmin,
        },
      });
      toast.success("Convite enviado", {
        description: `Um email foi enviado para ${email}`,
      });
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Falha ao convidar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar funcionário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-nome">Nome completo *</Label>
            <Input
              id="invite-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invite-cargo">Cargo</Label>
              <Input
                id="invite-cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-dep">Departamento</Label>
              <Input
                id="invite-dep"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="invite-admin" className="cursor-pointer">
                Permissão de administrador
              </Label>
              <p className="text-xs text-muted-foreground">
                Pode gerenciar usuários e configurações.
              </p>
            </div>
            <Switch id="invite-admin" checked={isAdmin} onCheckedChange={setIsAdmin} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !email.trim() || !nome.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}