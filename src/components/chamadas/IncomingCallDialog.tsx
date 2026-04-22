import { Phone, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCall, type RemoteUserInfo } from "@/contexts/CallContext";

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export function IncomingCallDialog() {
  const { status, remoteUser, tipo, acceptCall, rejectCall } = useCall();

  if (status !== "ringing" || !remoteUser) return null;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <DialogTitle>{tipo === "video" ? "Chamada de vídeo" : "Chamada de voz"}</DialogTitle>
          <DialogDescription>recebendo...</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-primary/30 animate-pulse">
              {remoteUser.avatar_url && (
                <AvatarImage src={remoteUser.avatar_url} alt={remoteUser.nome_completo} />
              )}
              <AvatarFallback className="text-2xl">
                {iniciais(remoteUser.nome_completo)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{remoteUser.nome_completo}</div>
            <div className="text-sm text-muted-foreground">
              {remoteUser.cargo ?? remoteUser.email}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="destructive"
            className="flex-1 gap-2"
            onClick={rejectCall}
          >
            <PhoneOff className="h-4 w-4" />
            Rejeitar
          </Button>
          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => void acceptCall()}
          >
            <Phone className="h-4 w-4" />
            Aceitar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}