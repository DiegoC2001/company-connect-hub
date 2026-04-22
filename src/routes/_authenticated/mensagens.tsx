import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Search, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useConversas, type Conversa } from "@/hooks/useConversas";
import { ChatSheet } from "@/components/contatos/ChatSheet";

export const Route = createFileRoute("/_authenticated/mensagens")({
  component: MensagensPage,
});

function MensagensPage() {
  const { user, empresaId } = useAuth();
  const { data: conversas, isLoading } = useConversas(user?.id ?? null);
  const [busca, setBusca] = useState("");
  
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const filtradas = conversas?.filter((c) =>
    c.outro_usuario_nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleOpenChat = (conversa: Conversa) => {
    setConversaAtiva(conversa);
    setChatOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mensagens" 
        description="Gerencie suas conversas e mensagens recentes." 
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar conversas..."
          className="pl-9"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filtradas && filtradas.length > 0 ? (
          filtradas.map((conversa) => (
            <Card
              key={conversa.outro_usuario_id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleOpenChat(conversa)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversa.outro_usuario_avatar ?? undefined} />
                    <AvatarFallback>
                      {conversa.outro_usuario_nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conversa.nao_lidas > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                      {conversa.nao_lidas}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold truncate">
                      {conversa.outro_usuario_nome}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversa.data_ultima_mensagem), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversa.ultima_mensagem}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Sem conversas</h3>
            <p className="max-w-xs mx-auto mt-2">
              {busca ? "Nenhuma conversa encontrada para sua busca." : "Inicie uma conversa com seus colegas na aba de Contatos."}
            </p>
          </div>
        )}
      </div>

      <ChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        contato={conversaAtiva ? {
          id: conversaAtiva.outro_usuario_id,
          nome_completo: conversaAtiva.outro_usuario_nome,
          avatar_url: conversaAtiva.outro_usuario_avatar,
          // Add dummy fields for compatibility with Funcionario type
          email: "",
          empresa_id: empresaId || "",
          status_presenca: "offline",
          ativo: true,
          created_at: "",
          updated_at: "",
          ultimo_acesso: null,
          cargo: null,
          departamento: null
        } : null}
        userId={user?.id ?? null}
        empresaId={empresaId}
      />
    </div>
  );
}