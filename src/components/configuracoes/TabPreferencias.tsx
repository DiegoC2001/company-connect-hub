import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePreferencias,
  useDebouncedPrefs,
  type QualidadeVideo,
  type Preferencias,
} from "@/hooks/usePreferencias";
import type { Database } from "@/integrations/supabase/types";

type StatusPresenca = Database["public"]["Enums"]["status_presenca"];

export function TabPreferencias() {
  const { user } = useAuth();
  const { data, isLoading, save, isSaving } = usePreferencias(user?.id ?? null);
  const [local, setLocal] = useDebouncedPrefs(data, save);

  if (isLoading || !local) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const update = <K extends keyof Preferencias>(key: K, value: Preferencias[K]) =>
    setLocal({ ...local, [key]: value });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>Salvas automaticamente.</CardDescription>
        </div>
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> salvando…
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Status padrão ao entrar</Label>
            <Select
              value={local.status_padrao}
              onValueChange={(v) => update("status_padrao", v as StatusPresenca)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="ocupado">Ocupado</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
                <SelectItem value="offline">Invisível</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Qualidade de vídeo</Label>
            <Select
              value={local.qualidade_video}
              onValueChange={(v) => update("qualidade_video", v as QualidadeVideo)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Notificar chamadas perdidas</p>
            <p className="text-sm text-muted-foreground">
              Receber toast quando alguém ligar e você não atender.
            </p>
          </div>
          <Switch
            checked={local.notif_chamada_perdida}
            onCheckedChange={(v) => update("notif_chamada_perdida", v)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Não perturbe</p>
            <p className="text-sm text-muted-foreground">
              Silencia notificações de chamadas e mensagens.
            </p>
          </div>
          <Switch checked={local.nao_perturbe} onCheckedChange={(v) => update("nao_perturbe", v)} />
        </div>
      </CardContent>
    </Card>
  );
}