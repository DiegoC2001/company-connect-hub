import { useEffect, useState } from "react";
import { Loader2, Power, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useAtualizarFuncionario,
  type FuncionarioComRole,
} from "@/hooks/useUsuarios";
import { setUserAdmin } from "@/utils/admin.functions";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  usuario: FuncionarioComRole | null;
  currentUserId: string | null;
}

export function EditarUsuarioSheet({ open, onOpenChange, usuario, currentUserId }: Props) {
  const atualizar = useAtualizarFuncionario();
  const setAdmin = useServerFn(setUserAdmin);
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome_completo);
      setCargo(usuario.cargo ?? "");
      setDepartamento(usuario.departamento ?? "");
      setIsAdmin(usuario.is_admin);
    }
  }, [usuario]);

  if (!usuario) return null;

  const isSelf = usuario.id === currentUserId;

  const handleSalvar = async () => {
    try {
      await atualizar.mutateAsync({
        id: usuario.id,
        nome_completo: nome.trim(),
        cargo: cargo.trim() || null,
        departamento: departamento.trim() || null,
      });
      // Atualiza role se mudou
      if (isAdmin !== usuario.is_admin) {
        setSavingRole(true);
        await setAdmin({ data: { userId: usuario.id, isAdmin } });
        void qc.invalidateQueries({ queryKey: ["usuarios"] });
      }
      toast.success("Dados atualizados");
      onOpenChange(false);
    } catch (e) {
      toast.error("Falha ao salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleAtivo = async () => {
    try {
      await atualizar.mutateAsync({
        id: usuario.id,
        ativo: !usuario.ativo,
      });
      toast.success(usuario.ativo ? "Usuário desativado" : "Usuário reativado");
    } catch (e) {
      toast.error("Falha ao atualizar status", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const saving = atualizar.isPending || savingRole;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar funcionário</SheetTitle>
          <SheetDescription>{usuario.email}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome completo</Label>
            <Input
              id="edit-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cargo">Cargo</Label>
            <Input
              id="edit-cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-dep">Departamento</Label>
            <Input
              id="edit-dep"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              maxLength={80}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="edit-admin" className="cursor-pointer">
                  Administrador
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pode convidar e gerenciar usuários.
                </p>
              </div>
            </div>
            <Switch
              id="edit-admin"
              checked={isAdmin}
              onCheckedChange={setIsAdmin}
              disabled={isSelf}
            />
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Power className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status da conta</span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {usuario.ativo
                ? "Conta ativa. Desative para impedir o acesso."
                : "Conta desativada. Reative para permitir acesso novamente."}
            </p>
            <Button
              variant={usuario.ativo ? "destructive" : "default"}
              size="sm"
              onClick={handleToggleAtivo}
              disabled={isSelf || atualizar.isPending}
              className="w-full"
            >
              {usuario.ativo ? "Desativar conta" : "Reativar conta"}
            </Button>
            {isSelf && (
              <p className="mt-2 text-xs text-muted-foreground">
                Você não pode alterar o próprio status.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSalvar} disabled={saving || !nome.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
