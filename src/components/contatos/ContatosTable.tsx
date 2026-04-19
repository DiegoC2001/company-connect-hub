import { MessageCircle, Phone, Users, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PresencaBadge } from "./PresencaBadge";
import type { Funcionario } from "@/hooks/useFuncionarios";

interface Props {
  funcionarios: Funcionario[];
  loading: boolean;
  onCall: (f: Funcionario, tipo: "voz" | "video") => void;
  onMessage: (f: Funcionario) => void;
}

const podeReceberChamada = (status: Funcionario["status_presenca"]) =>
  status === "online" || status === "ocupado";

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export function ContatosTable({ funcionarios, loading, onCall, onMessage }: Props) {
  if (loading) {
    return (
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-20" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (funcionarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border bg-card py-16 text-center">
        <div className="rounded-full bg-muted p-3">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Nenhum contato encontrado</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Nenhum funcionário corresponde aos filtros aplicados ou sua empresa ainda não tem outros
          colaboradores cadastrados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {funcionarios.map((f) => {
            const callDisabled = !podeReceberChamada(f.status_presenca);
            return (
              <TableRow key={f.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {f.avatar_url && <AvatarImage src={f.avatar_url} alt={f.nome_completo} />}
                      <AvatarFallback>{iniciais(f.nome_completo)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{f.nome_completo}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {f.cargo ?? f.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {f.departamento ?? "—"}
                </TableCell>
                <TableCell>
                  <PresencaBadge status={f.status_presenca} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {f.ultimo_acesso
                    ? formatDistanceToNow(new Date(f.ultimo_acesso), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={callDisabled ? "Indisponível para chamadas" : "Chamada de voz"}
                      disabled={callDisabled}
                      onClick={() => onCall(f, "voz")}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={callDisabled ? "Indisponível para chamadas" : "Chamada de vídeo"}
                      disabled={callDisabled}
                      onClick={() => onCall(f, "video")}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Enviar mensagem"
                      onClick={() => onMessage(f)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
