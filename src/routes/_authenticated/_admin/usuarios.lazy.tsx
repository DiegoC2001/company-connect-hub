import { useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Plus, ShieldCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useUsuarios, type FuncionarioComRole } from "@/hooks/useUsuarios";
import { ConvidarUsuarioDialog } from "@/components/admin/ConvidarUsuarioDialog";
import { EditarUsuarioSheet } from "@/components/admin/EditarUsuarioSheet";

export const Route = createLazyFileRoute("/_authenticated/_admin/usuarios")({
  component: UsuariosPage,
});

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

function UsuariosPage() {
  const { user, empresaId } = useAuth();
  const { data: usuarios, isLoading } = useUsuarios(empresaId);
  const [convidarOpen, setConvidarOpen] = useState(false);
  const [editarUsuario, setEditarUsuario] = useState<FuncionarioComRole | null>(null);

  return (
    <div>
      <PageHeader
        title="Gerenciar Usuários"
        description="Administre funcionários, papéis e permissões."
        actions={
          <Button onClick={() => setConvidarOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Convidar usuário
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cargo / Departamento</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !usuarios || usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-muted p-3">
                        <UserX className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mt-3 text-base font-semibold">Nenhum funcionário</h3>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Convide o primeiro funcionário para sua empresa.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.nome_completo} />}
                          <AvatarFallback>{iniciais(u.nome_completo)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {u.nome_completo}
                            {u.id === user?.id && (
                              <span className="ml-1.5 text-xs text-muted-foreground">(você)</span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{u.cargo ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.departamento ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      {u.is_admin ? (
                        <Badge variant="default" className="gap-1">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">Funcionário</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.ativo ? (
                        <Badge variant="secondary">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.ultimo_acesso
                        ? formatDistanceToNow(new Date(u.ultimo_acesso), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditarUsuario(u)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConvidarUsuarioDialog open={convidarOpen} onOpenChange={setConvidarOpen} />
      <EditarUsuarioSheet
        open={!!editarUsuario}
        onOpenChange={(v) => !v && setEditarUsuario(null)}
        usuario={editarUsuario}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}