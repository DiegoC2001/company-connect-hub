import { useEffect, useState } from "react";
import { MessageCircle, Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Funcionario } from "@/hooks/useFuncionarios";

interface Props {
  open: boolean;
  contato: Funcionario | null;
  tipo: "voz" | "video";
  onCancel: () => void;
  onLeaveMessage: () => void;
}

const formatTimer = (s: number) => {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

// TODO: integrar com server function `iniciar-chamada` para criar registro em `chamadas`
// e com WebRTC real (vídeo/voz) no próximo passo.
export function CallDialog({ open, contato, tipo, onCancel, onLeaveMessage }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!open) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [open]);

  if (!contato) return null;

  const Icon = tipo === "video" ? Video : Phone;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tipo === "video" ? "Chamada de vídeo" : "Chamada de voz"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {contato.avatar_url && (
                <AvatarImage src={contato.avatar_url} alt={contato.nome_completo} />
              )}
              <AvatarFallback className="text-2xl">
                {iniciais(contato.nome_completo)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{contato.nome_completo}</div>
            <div className="text-sm text-muted-foreground">{contato.cargo ?? contato.email}</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Aguardando resposta... <span className="font-mono">{formatTimer(seconds)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onLeaveMessage}>
            <MessageCircle className="mr-2 h-4 w-4" /> Deixar mensagem
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onCancel}>
            <PhoneOff className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
