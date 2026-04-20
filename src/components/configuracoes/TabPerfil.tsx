import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AvatarUploader } from "./AvatarUploader";

const perfilSchema = z.object({
  nome_completo: z.string().trim().min(1, "Nome obrigatório").max(100),
  cargo: z.string().trim().max(100).optional().or(z.literal("")),
  departamento: z.string().trim().max(100).optional().or(z.literal("")),
});
type PerfilForm = z.infer<typeof perfilSchema>;

const senhaSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Za-z]/, "Deve conter letra")
      .regex(/\d/, "Deve conter número"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });
type SenhaForm = z.infer<typeof senhaSchema>;

export function TabPerfil() {
  const { funcionario, refreshFuncionario } = useAuth();
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);

  const perfilForm = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome_completo: funcionario?.nome_completo ?? "",
      cargo: funcionario?.cargo ?? "",
      departamento: funcionario?.departamento ?? "",
    },
    values: {
      nome_completo: funcionario?.nome_completo ?? "",
      cargo: funcionario?.cargo ?? "",
      departamento: funcionario?.departamento ?? "",
    },
  });

  const senhaForm = useForm<SenhaForm>({
    resolver: zodResolver(senhaSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSavePerfil(values: PerfilForm) {
    if (!funcionario) return;
    setSavingPerfil(true);
    try {
      const { error } = await supabase
        .from("funcionarios")
        .update({
          nome_completo: values.nome_completo,
          cargo: values.cargo || null,
          departamento: values.departamento || null,
        })
        .eq("id", funcionario.id);
      if (error) throw error;
      await refreshFuncionario();
      toast.success("Perfil atualizado");
    } catch (e) {
      toast.error("Falha ao salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSavingPerfil(false);
    }
  }

  async function onSaveSenha(values: SenhaForm) {
    setSavingSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      senhaForm.reset({ password: "", confirm: "" });
      toast.success("Senha alterada");
    } catch (e) {
      toast.error("Falha ao alterar senha", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSavingSenha(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Suas informações pessoais e foto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUploader
            nome={funcionario?.nome_completo ?? ""}
            avatarUrl={funcionario?.avatar_url ?? null}
          />
          <Separator />
          <form onSubmit={perfilForm.handleSubmit(onSavePerfil)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" {...perfilForm.register("nome_completo")} />
              {perfilForm.formState.errors.nome_completo && (
                <p className="text-sm text-destructive">
                  {perfilForm.formState.errors.nome_completo.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" {...perfilForm.register("cargo")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept">Departamento</Label>
                <Input id="dept" {...perfilForm.register("departamento")} />
              </div>
            </div>
            <Button type="submit" disabled={savingPerfil}>
              {savingPerfil && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Mínimo 8 caracteres, com letras e números.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={senhaForm.handleSubmit(onSaveSenha)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pwd">Nova senha</Label>
                <Input id="pwd" type="password" {...senhaForm.register("password")} />
                {senhaForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {senhaForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd2">Confirmar senha</Label>
                <Input id="pwd2" type="password" {...senhaForm.register("confirm")} />
                {senhaForm.formState.errors.confirm && (
                  <p className="text-sm text-destructive">
                    {senhaForm.formState.errors.confirm.message}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" variant="secondary" disabled={savingSenha}>
              {savingSenha && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
