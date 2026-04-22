-- Backfill: cria registros faltantes em public.funcionarios e public.user_roles
-- para usuários do auth.users que não têm registro ainda (ex.: criados antes do trigger handle_new_user).
INSERT INTO public.funcionarios (id, empresa_id, email, nome_completo, status_presenca, ativo)
SELECT
  u.id,
  e.id AS empresa_id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nome_completo', split_part(u.email, '@', 1)) AS nome_completo,
  'offline'::public.status_presenca,
  true
FROM auth.users u
JOIN public.empresas e
  ON lower(e.dominio_email) = lower(split_part(u.email, '@', 2))
LEFT JOIN public.funcionarios f ON f.id = u.id
WHERE f.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT f.id, 'funcionario'::public.app_role
FROM public.funcionarios f
LEFT JOIN public.user_roles r ON r.user_id = f.id
WHERE r.user_id IS NULL;