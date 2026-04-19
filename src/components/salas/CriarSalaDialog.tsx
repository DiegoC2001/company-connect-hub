import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useCriarSala } from "@/hooks/useSalas";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string | null;
  userId: string | null;
}

export function CriarSalaDialog({ open, onOpenChange, empresaId, userId }: Props) {
  const [nome, setNome] = useState("");
  const [convidados, setConvidados] = useState<Set<string>>(new Set());
  const { data: funcionarios } = useFuncionarios(empresaId, userId);
  const criar = useCriarSala();

  const reset = () => {
    setNome("");
    setConvidados(new Set());
  };

  const toggle = (id: string) => {
    setConvidados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCriar = async () => {
    if (!nome.trim() || !empresaId || !userId) return;
    if (nome.trim().length > 100) {
      toast.error("Nome deve ter no máximo 100 caracteres");
      return;
    }
    try {
      await criar.mutateAsync({
        nome_sala: nome.trim(),
        empresa_id: empresaId,
        criador_id: userId,
        participantes: [userId, ...Array.from(convidados)],
      });
      toast.success("Sala criada com sucesso");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error("Falha ao criar sala", {
        description: e instanceof Error ? e.message : undefined,
      });
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
          <DialogTitle>Nova sala de reunião</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-sala">Nome da sala</Label>
            <Input
              id="nome-sala"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Reunião semanal"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Convidados</Label>
            <ScrollArea className="h-48 rounded-md border">
              <div className="space-y-1 p-2">
                {funcionarios && funcionarios.length > 0 ? (
                  funcionarios.map((f) => (
                    <label
                      key={f.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"
                    >
                      <Checkbox
                        checked={convidados.has(f.id)}
                        onCheckedChange={() => toggle(f.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{f.nome_completo}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {f.cargo ?? f.email}
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum colega disponível.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCriar} disabled={!nome.trim() || criar.isPending}>
            {criar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar sala
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
