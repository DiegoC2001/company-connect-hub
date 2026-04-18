-- Habilita RLS na tabela de mensagens do Realtime (controla quem pode subscrever a canais)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados só podem subscrever a canais da própria empresa
-- Convenção de nome de canal: "empresa:<empresa_id>:..." ou "user:<user_id>:..."
CREATE POLICY "Subscrição apenas a canais da própria empresa"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Canais da empresa do usuário
  realtime.topic() LIKE ('empresa:' || public.get_minha_empresa()::text || ':%')
  OR realtime.topic() = ('empresa:' || public.get_minha_empresa()::text)
  -- Canais privados pessoais
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
);

-- Política: usuários autenticados podem publicar broadcasts apenas nos próprios canais autorizados
CREATE POLICY "Broadcast apenas em canais da própria empresa"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE ('empresa:' || public.get_minha_empresa()::text || ':%')
  OR realtime.topic() = ('empresa:' || public.get_minha_empresa()::text)
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
);