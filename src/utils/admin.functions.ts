import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function ensureAdminAndEmpresa(userId: string) {
  const [{ data: roles }, { data: func }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin.from("funcionarios").select("empresa_id").eq("id", userId).maybeSingle(),
  ]);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!isAdmin) throw new Error("Apenas administradores podem executar esta ação");
  if (!func?.empresa_id) throw new Error("Empresa não encontrada");
  return func.empresa_id;
}

const inviteSchema = z.object({
  email: z.string().trim().email().max(255),
  nomeCompleto: z.string().trim().min(1).max(120),
  cargo: z.string().trim().max(80).optional().nullable(),
  departamento: z.string().trim().max(80).optional().nullable(),
  isAdmin: z.boolean().default(false),
});

export const inviteFuncionario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const empresaId = await ensureAdminAndEmpresa(context.userId);

    // Verifica domínio do email contra empresa
    const { data: empresa } = await supabaseAdmin
      .from("empresas")
      .select("dominio_email")
      .eq("id", empresaId)
      .maybeSingle();
    const dominio = data.email.split("@")[1]?.toLowerCase();
    if (!empresa || empresa.dominio_email.toLowerCase() !== dominio) {
      throw new Error(
        `Email deve pertencer ao domínio @${empresa?.dominio_email ?? "da empresa"}`,
      );
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { nome_completo: data.nomeCompleto },
    });
    if (error) throw new Error(error.message);

    const newUserId = created.user?.id;
    if (!newUserId) throw new Error("Falha ao criar usuário");

    // Atualiza cargo/departamento (linha já criada pelo trigger handle_new_user)
    if (data.cargo || data.departamento) {
      await supabaseAdmin
        .from("funcionarios")
        .update({
          cargo: data.cargo ?? null,
          departamento: data.departamento ?? null,
        })
        .eq("id", newUserId);
    }

    if (data.isAdmin) {
      // Substitui role 'funcionario' por 'admin'
      await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
      await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "admin" });
    }

    return { success: true, userId: newUserId };
  });

const setAdminSchema = z.object({
  userId: z.string().uuid(),
  isAdmin: z.boolean(),
});

const setPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(6).max(72),
});

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setPasswordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const empresaId = await ensureAdminAndEmpresa(context.userId);
    const { data: alvo } = await supabaseAdmin
      .from("funcionarios")
      .select("empresa_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!alvo || alvo.empresa_id !== empresaId) {
      throw new Error("Funcionário não pertence à sua empresa");
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setAdminSchema.parse(input))
  .handler(async ({ data, context }) => {
    const empresaId = await ensureAdminAndEmpresa(context.userId);

    // Garante que o alvo é da mesma empresa
    const { data: alvo } = await supabaseAdmin
      .from("funcionarios")
      .select("empresa_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!alvo || alvo.empresa_id !== empresaId) {
      throw new Error("Funcionário não pertence à sua empresa");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").insert({
      user_id: data.userId,
      role: data.isAdmin ? "admin" : "funcionario",
    });
    return { success: true };
  });
