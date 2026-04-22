-- Create meeting room messages table
CREATE TABLE IF NOT EXISTS public.mensagens_sala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sala_id UUID NOT NULL REFERENCES public.salas_reuniao(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    data_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
    arquivo_url TEXT,
    tipo_arquivo TEXT
);

-- Enable RLS
ALTER TABLE public.mensagens_sala ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver mensagens das salas da sua empresa"
    ON public.mensagens_sala FOR SELECT
    USING (empresa_id = get_minha_empresa());

CREATE POLICY "Participantes podem enviar mensagens em salas da sua empresa"
    ON public.mensagens_sala FOR INSERT
    WITH CHECK (empresa_id = get_minha_empresa());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_mensagens_sala_sala_id ON public.mensagens_sala(sala_id);
