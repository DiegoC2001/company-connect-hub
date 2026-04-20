-- 1. Bucket público para avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS em storage.objects para o bucket avatars
CREATE POLICY "Avatares são publicamente visíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Usuário envia avatar na própria pasta"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuário atualiza próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuário apaga próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Tabela de preferências
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  status_padrao public.status_presenca NOT NULL DEFAULT 'online',
  notif_chamada_perdida boolean NOT NULL DEFAULT true,
  qualidade_video text NOT NULL DEFAULT 'auto' CHECK (qualidade_video IN ('auto','alta','media')),
  nao_perturbe boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprias preferências"
ON public.user_preferences FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuário cria próprias preferências"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário atualiza próprias preferências"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Trigger updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();