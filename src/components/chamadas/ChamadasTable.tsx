import { ArrowDownLeft, ArrowUpRight, Phone, PhoneMissed, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChamadaComContatos } from "@/hooks/useChamadas";

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const formatDuracao = (s: number) => {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  em_andamento: { label: "Em andamento", variant: "default" },
  completada: { label: "Completada", variant: "secondary" },
  perdida: { label: "Perdida", variant: "destructive" },
  rejeitada: { label: "Rejeitada", variant: "outline" },
};

interface Props {
  chamadas: ChamadaComContatos[];
  loading: boolean;
  currentUserId: string | null;
  onRecall: (c: ChamadaComContatos) => void;
}

export function ChamadasTable({ chamadas, loading, currentUserId, onRecall }: Props) {
  if (loading) {
    return (
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (chamadas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border bg-card py-16 text-center">
        <div className="rounded-full bg-muted p-3">
          <Phone className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Nenhuma chamada encontrada</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Suas chamadas aparecerão aqui após a primeira ligação.
        </p>
        <Button asChild className="mt-6">
          <Link to="/contatos">Fazer sua primeira chamada</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Qualidade</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chamadas.map((c) => {
            const recebida = c.destinatario_id === currentUserId;
            const contato = recebida ? c.remetente : c.destinatario;
            const Icon =
              c.status === "perdida" ? PhoneMissed : recebida ? ArrowDownLeft : ArrowUpRight;
            const statusCfg = STATUS_LABEL[c.status] ?? {
              label: c.status,
              variant: "outline" as const,
            };
            return (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        c.status === "perdida"
                          ? "bg-destructive/10 text-destructive"
                          : recebida
                            ? "bg-status-online/15 text-status-online"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <Avatar className="h-9 w-9">
                      {contato?.avatar_url && (
                        <AvatarImage src={contato.avatar_url} alt={contato.nome_completo} />
                      )}
                      <AvatarFallback>
                        {contato ? iniciais(contato.nome_completo) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {contato?.nome_completo ?? "Desconhecido"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {recebida ? "Recebida" : "Realizada"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDuracao(c.duracao_segundos)}
                </TableCell>
                <TableCell>
                  {c.qualidade != null ? (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-status-ausente text-status-ausente" />
                      {c.qualidade}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(c.iniciada_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!contato}
                    onClick={() => onRecall(c)}
                  >
                    <Phone className="mr-1.5 h-3.5 w-3.5" />
                    Rechamar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
