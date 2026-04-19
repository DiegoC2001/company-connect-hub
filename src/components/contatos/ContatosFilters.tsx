import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["status_presenca"] | "todos";

interface Props {
  busca: string;
  setBusca: (v: string) => void;
  departamento: string;
  setDepartamento: (v: string) => void;
  status: Status;
  setStatus: (v: Status) => void;
  departamentos: string[];
  onLimpar: () => void;
}

export function ContatosFilters({
  busca,
  setBusca,
  departamento,
  setDepartamento,
  status,
  setStatus,
  departamentos,
  onLimpar,
}: Props) {
  const hasFilters = busca || departamento !== "todos" || status !== "todos";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="pl-9"
        />
      </div>
      <Select value={departamento} onValueChange={setDepartamento}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos departamentos</SelectItem>
          {departamentos.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos status</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="ocupado">Ocupado</SelectItem>
          <SelectItem value="ausente">Ausente</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onLimpar}>
          <X className="mr-1 h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
