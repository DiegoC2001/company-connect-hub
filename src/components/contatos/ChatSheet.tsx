import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMensagensChat } from "@/hooks/useMensagensChat";
import { PresencaDot } from "./PresencaBadge";
import type { Funcionario } from "@/hooks/useFuncionarios";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato: Funcionario | null;
  userId: string | null;
  empresaId: string | null;
}

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export function ChatSheet({ open, onOpenChange, contato, userId, empresaId }: Props) {
  const [texto, setTexto] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    data: mensagens,
    isLoading,
    sendMessage,
    isSending,
    isOutroDigitando,
    setTyping,
  } = useMensagensChat(userId, contato?.id ?? null, empresaId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleSend = async () => {
    const v = texto.trim();
    if (!v) return;
    try {
      await sendMessage({ conteudo: v });
      setTexto("");
    } catch (e) {
      toast.error("Falha ao enviar mensagem", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !empresaId) return;

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${empresaId}/${userId}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      await sendMessage({
        conteudo: `Arquivo: ${file.name}`,
        arquivo_url: publicUrl,
        tipo_arquivo: file.type,
      });

      toast.success("Arquivo enviado com sucesso");
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          {contato && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  {contato.avatar_url && (
                    <AvatarImage src={contato.avatar_url} alt={contato.nome_completo} />
                  )}
                  <AvatarFallback>{iniciais(contato.nome_completo)}</AvatarFallback>
                </Avatar>
                <PresencaDot
                  status={contato.status_presenca}
                  className="absolute -bottom-0.5 -right-0.5 ring-2 ring-background"
                />
              </div>
              <div className="min-w-0 text-left">
                <SheetTitle className="truncate text-base">{contato.nome_completo}</SheetTitle>
                <SheetDescription className="truncate text-xs flex items-center gap-1">
                  {isOutroDigitando ? (
                    <span className="text-primary font-medium animate-pulse">Digitando...</span>
                  ) : (
                    contato.cargo ?? contato.email
                  )}
                </SheetDescription>
              </div>
            </div>
          )}
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 p-4">
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-2/3 rounded-lg" />
                <Skeleton className="ml-auto h-12 w-1/2 rounded-lg" />
                <Skeleton className="h-12 w-3/5 rounded-lg" />
              </>
            ) : mensagens && mensagens.length > 0 ? (
              mensagens.map((m) => {
                const minha = m.remetente_id === userId;
                return (
                  <div
                    key={m.id}
                    className={cn("flex flex-col gap-1", minha ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        minha ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                      )}
                    >
                      {m.arquivo_url && (
                        <div className="mb-2">
                          {m.tipo_arquivo?.startsWith("image/") ? (
                            <img
                              src={m.arquivo_url}
                              alt="Anexo"
                              className="max-h-48 rounded-md object-contain cursor-pointer hover:opacity-90"
                              onClick={() => window.open(m.arquivo_url!, "_blank")}
                            />
                          ) : (
                            <a
                              href={m.arquivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 underline"
                            >
                              <Paperclip className="h-4 w-4" />
                              Ver anexo
                            </a>
                          )}
                        </div>
                      )}
                      {m.conteudo}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(m.data_envio), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma mensagem ainda. Diga olá! 👋
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-3">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!contato || isSending || isUploading}
              title="Anexar arquivo"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  setTyping(false);
                }, 2000);
              }}
              placeholder="Digite uma mensagem..."
              disabled={!contato || isSending}
            />
            <Button type="submit" size="icon" disabled={!texto.trim() || isSending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}