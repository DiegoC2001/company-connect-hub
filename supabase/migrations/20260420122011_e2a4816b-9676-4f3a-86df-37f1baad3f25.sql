-- Replace the overly permissive self-update policy on funcionarios
DROP POLICY IF EXISTS "Funcionário atualiza próprio perfil" ON public.funcionarios;

CREATE POLICY "Funcionário atualiza próprio perfil"
ON public.funcionarios
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND empresa_id = public.get_minha_empresa()
);