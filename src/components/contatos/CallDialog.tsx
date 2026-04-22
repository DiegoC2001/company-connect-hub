import { MessageCircle, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCall, type RemoteUserInfo } from "@/contexts/CallContext";
import type { Funcionario } from "@/hooks/useFuncionarios";

interface Props {
  contato: Funcionario | null;
  tipo: "voz" | "video";
  onLeaveMessage: () => void;
}

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export function CallDialog({ contato, tipo, onLeaveMessage }: Props) {
  const { startCall, hangUp, status } = useCall();

  const handleCall = async () => {
    if (!contato) return;
    const remote: RemoteUserInfo = {
      id: contato.id,
      nome_completo: contato.nome_completo,
      avatar_url: contato.avatar_url,
      cargo: contato.cargo,
      email: contato.email,
    };
    await startCall(remote, tipo);
  };

  // This dialog is only used to INITIATE the call.
  // Once calling/connected, ActiveCallOverlay takes over.
  if (!contato) return null;

  // Show a simple confirmation dialog before starting the call
  const isIdle = status === "idle";
  if (!isIdle) return null;

  return null; // The call is now triggered directly from contatos.tsx
}

// Exported helper to start a call from contatos page
export function useStartCall() {
  const { startCall, status } = useCall();

  const initCall = async (contato: Funcionario, tipo: "voz" | "video") => {
    if (status !== "idle") return;
    const remote: RemoteUserInfo = {
      id: contato.id,
      nome_completo: contato.nome_completo,
      avatar_url: contato.avatar_url,
      cargo: contato.cargo,
      email: contato.email,
    };
    await startCall(remote, tipo);
  };

  return { initCall, isBusy: status !== "idle" };
}