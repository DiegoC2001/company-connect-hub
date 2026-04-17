-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario');
CREATE TYPE public.status_presenca AS ENUM ('online', 'ocupado', 'ausente', 'offline');
CREATE TYPE public.status_chamada AS ENUM ('em_andamento', 'completada', 'perdida', 'rejeitada');

-- =========================================
-- TABELAS
-- =========================================
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dominio_email TEXT NOT NULL UNIQUE,
  plano TEXT NOT NULL DEFAULT 'free',
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome_completo TEXT NOT NULL,
  avatar_url TEXT,
  cargo TEXT,
  departamento TEXT,
  status_presenca public.status_presenca NOT NULL DEFAULT 'offline',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_funcionarios_empresa ON public.funcionarios(empresa_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

CREATE TABLE public.chamadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  status public.status_chamada NOT NULL DEFAULT 'em_andamento',
  duracao_segundos INTEGER NOT NULL DEFAULT 0,
  qualidade INTEGER,
  iniciada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizada_em TIMESTAMPTZ
);
CREATE INDEX idx_chamadas_empresa ON public.chamadas(empresa_id);
CREATE INDEX idx_chamadas_remetente ON public.chamadas(remetente_id);
CREATE INDEX idx_chamadas_destinatario ON public.chamadas(destinatario_id);

CREATE TABLE public.mensagens_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo_arquivo TEXT,
  arquivo_url TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  data_envio TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mensagens_empresa ON public.mensagens_chat(empresa_id);
CREATE INDEX idx_mensagens_conversa ON public.mensagens_chat(remetente_id, destinatario_id, data_envio DESC);

CREATE TABLE public.salas_reuniao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_sala TEXT NOT NULL,
  criador_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  participantes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativa BOOLEAN NOT NULL DEFAULT true,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_salas_empresa ON public.salas_reuniao(empresa_id);

-- =========================================
-- SECURITY DEFINER FUNCTIONS (evitam recursão em RLS)
-- =========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_minha_empresa()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.funcionarios WHERE id = auth.uid() LIMIT 1
$$;

-- =========================================
-- TRIGGER: updated_at em funcionarios
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_funcionarios_updated_at
BEFORE UPDATE ON public.funcionarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- TRIGGER: cadastro automático por domínio
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dominio TEXT;
  v_empresa_id UUID;
  v_nome TEXT;
BEGIN
  v_dominio := lower(split_part(NEW.email, '@', 2));

  SELECT id INTO v_empresa_id
  FROM public.empresas
  WHERE lower(dominio_email) = v_dominio
  LIMIT 1;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Domínio % não está autorizado. Solicite ao administrador o cadastro da empresa.', v_dominio;
  END IF;

  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1));

  INSERT INTO public.funcionarios (id, empresa_id, email, nome_completo, status_presenca, ativo)
  VALUES (NEW.id, v_empresa_id, NEW.email, v_nome, 'offline', true);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salas_reuniao ENABLE ROW LEVEL SECURITY;

-- EMPRESAS
CREATE POLICY "Usuários veem sua própria empresa"
ON public.empresas FOR SELECT TO authenticated
USING (id = public.get_minha_empresa());

CREATE POLICY "Admins podem atualizar sua empresa"
ON public.empresas FOR UPDATE TO authenticated
USING (id = public.get_minha_empresa() AND public.has_role(auth.uid(), 'admin'));

-- FUNCIONARIOS
CREATE POLICY "Funcionários veem colegas da mesma empresa"
ON public.funcionarios FOR SELECT TO authenticated
USING (empresa_id = public.get_minha_empresa());

CREATE POLICY "Funcionário atualiza próprio perfil"
ON public.funcionarios FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins atualizam funcionários da empresa"
ON public.funcionarios FOR UPDATE TO authenticated
USING (empresa_id = public.get_minha_empresa() AND public.has_role(auth.uid(), 'admin'));

-- USER_ROLES
CREATE POLICY "Usuário vê seus próprios papéis"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins veem papéis da empresa"
ON public.user_roles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id = user_roles.user_id
      AND f.empresa_id = public.get_minha_empresa()
  )
);

CREATE POLICY "Admins gerenciam papéis da empresa"
ON public.user_roles FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id = user_roles.user_id
      AND f.empresa_id = public.get_minha_empresa()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id = user_roles.user_id
      AND f.empresa_id = public.get_minha_empresa()
  )
);

-- CHAMADAS
CREATE POLICY "Participantes veem suas chamadas"
ON public.chamadas FOR SELECT TO authenticated
USING (
  empresa_id = public.get_minha_empresa()
  AND (remetente_id = auth.uid() OR destinatario_id = auth.uid())
);

CREATE POLICY "Funcionário cria chamadas que envia"
ON public.chamadas FOR INSERT TO authenticated
WITH CHECK (
  empresa_id = public.get_minha_empresa()
  AND remetente_id = auth.uid()
);

CREATE POLICY "Participantes atualizam suas chamadas"
ON public.chamadas FOR UPDATE TO authenticated
USING (
  empresa_id = public.get_minha_empresa()
  AND (remetente_id = auth.uid() OR destinatario_id = auth.uid())
);

-- MENSAGENS_CHAT
CREATE POLICY "Participantes veem suas mensagens"
ON public.mensagens_chat FOR SELECT TO authenticated
USING (
  empresa_id = public.get_minha_empresa()
  AND (remetente_id = auth.uid() OR destinatario_id = auth.uid())
);

CREATE POLICY "Funcionário envia mensagens próprias"
ON public.mensagens_chat FOR INSERT TO authenticated
WITH CHECK (
  empresa_id = public.get_minha_empresa()
  AND remetente_id = auth.uid()
);

CREATE POLICY "Destinatário marca mensagem como lida"
ON public.mensagens_chat FOR UPDATE TO authenticated
USING (
  empresa_id = public.get_minha_empresa()
  AND destinatario_id = auth.uid()
);

-- SALAS_REUNIAO
CREATE POLICY "Funcionários veem salas da empresa"
ON public.salas_reuniao FOR SELECT TO authenticated
USING (empresa_id = public.get_minha_empresa());

CREATE POLICY "Funcionários criam salas na própria empresa"
ON public.salas_reuniao FOR INSERT TO authenticated
WITH CHECK (
  empresa_id = public.get_minha_empresa()
  AND criador_id = auth.uid()
);

CREATE POLICY "Funcionários atualizam salas da empresa"
ON public.salas_reuniao FOR UPDATE TO authenticated
USING (empresa_id = public.get_minha_empresa());

CREATE POLICY "Criador apaga sua sala"
ON public.salas_reuniao FOR DELETE TO authenticated
USING (criador_id = auth.uid());

-- =========================================
-- REALTIME
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chamadas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funcionarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.salas_reuniao;