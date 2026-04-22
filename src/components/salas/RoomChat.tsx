import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMensagensSala } from "@/hooks/useMensagensSala";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  salaId: string;
  userId: string;
  empresaId: string;
  onClose?: () => void;
}

export function RoomChat({ salaId, userId, empresaId, onClose }: Props) {
  const [texto, setTexto] = useState("");
  const { data: mensagens, sendMessage, isSending } = useMensagensSala(salaId, userId, empresaId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!texto.trim() || isSending) return;
    try {
      await sendMessage(texto.trim());
      setTexto("");
    } catch (error) {
      console.error("Erro ao enviar mensagem na sala:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background border-l">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <MessageSquare className="h-4 w-4" />
          Chat da Sala
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {mensagens?.map((m) => {
            const minha = m.remetente_id === userId;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1",
                  minha ? "items-end" : "items-start"
                )}
              >
                {!minha && (
                  <span className="text-[10px] font-medium text-muted-foreground ml-1">
                    {m.remetente?.nome_completo}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    minha
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {m.conteudo}
                </div>
                <span className="text-[9px] text-muted-foreground px-1">
                  {format(new Date(m.data_envio), "HH:mm")}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Mensagem..."
          className="flex-1"
          disabled={isSending}
        />
        <Button type="submit" size="icon" disabled={!texto.trim() || isSending}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
