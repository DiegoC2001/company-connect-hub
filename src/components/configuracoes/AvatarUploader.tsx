import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { resizeImageToSquareJpeg } from "@/lib/image";
import { useAuth } from "@/contexts/AuthContext";

const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  nome: string;
  avatarUrl: string | null;
}

export function AvatarUploader({ nome, avatarUrl }: Props) {
  const { user, refreshFuncionario } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const initials = nome
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleFile(file: File) {
    if (!user) return;
    if (file.size > MAX_BYTES) {
      toast.error("Imagem muito grande", { description: "Máximo 5MB." });
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      const resized = await resizeImageToSquareJpeg(file, 512, 0.85);
      const path = `${user.id}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, resized, { upsert: true, contentType: "image/jpeg", cacheControl: "0" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("funcionarios")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (updErr) throw updErr;
      await refreshFuncionario();
      toast.success("Avatar atualizado");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Falha ao enviar avatar", { description: msg });
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={preview ?? avatarUrl ?? undefined} alt={nome} />
        <AvatarFallback className="text-lg">{initials || "?"}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          Trocar foto
        </Button>
        <p className="text-xs text-muted-foreground">JPG ou PNG, até 5MB.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
