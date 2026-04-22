import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Circle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type StatusPresenca = Database["public"]["Enums"]["status_presenca"];

const statusConfig: Record<StatusPresenca, { label: string; color: string }> = {
  online: { label: "Online", color: "text-green-500 fill-green-500" },
  ocupado: { label: "Ocupado", color: "text-red-500 fill-red-500" },
  ausente: { label: "Ausente", color: "text-yellow-500 fill-yellow-500" },
  offline: { label: "Offline", color: "text-muted-foreground fill-muted-foreground" },
};

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppHeader() {
  const { funcionario, signOut, updatePresenca } = useAuth();
  const navigate = useNavigate();

  const status: StatusPresenca = funcionario?.status_presenca ?? "offline";
  const current = statusConfig[status];

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: "/login" });
  };

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      <div className="ml-auto flex items-center gap-2">
        {/* Status presença */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Circle className={`h-2.5 w-2.5 ${current.color}`} />
              <span className="text-sm">{current.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Definir status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["online", "ocupado", "ausente"] as const).map((s) => (
              <DropdownMenuItem key={s} onClick={() => void updatePresenca(s)}>
                <Circle className={`mr-2 h-2.5 w-2.5 ${statusConfig[s].color}`} />
                {statusConfig[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[10px]"
          >
            0
          </Badge>
        </Button>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials(funcionario?.nome_completo)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <div className="text-sm font-medium leading-tight">
                  {funcionario?.nome_completo ?? "Usuário"}
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {funcionario?.cargo ?? "—"}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{funcionario?.nome_completo}</div>
              <div className="text-xs font-normal text-muted-foreground">{funcionario?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void navigate({ to: "/configuracoes" })}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
