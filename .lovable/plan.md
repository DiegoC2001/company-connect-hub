
# CommUnity — Plataforma de comunicação corporativa

App tipo Slack/Teams para empresas, com chat em tempo real, chamadas de voz, presença e administração — multi-tenant isolado por empresa via domínio de email.

## Estilo visual
Design minimalista escuro (estilo Linear/Notion), com sidebar lateral, acentos em azul-violeta e tipografia limpa. Foco em produtividade e densidade de informação confortável.

## Backend (Lovable Cloud / Supabase)

**Tabelas**
- `empresas` — id, nome, dominio_email, plano, data_criacao
- `funcionarios` — vinculado a `auth.users`; perfil, cargo, departamento, status_presença, ativo, último_acesso
- `user_roles` — tabela separada para roles (admin/funcionario), evitando escalonamento de privilégio
- `chamadas` — registro de chamadas de voz (tipo fixo "voz")
- `mensagens_chat` — mensagens 1:1 com suporte a anexos
- `salas_reuniao` — salas de voz em grupo com participantes em jsonb

**Row Level Security**
- Função `security definer` `get_minha_empresa()` para isolar dados por empresa sem recursão
- Função `has_role()` para verificações de admin
- Cada tabela só permite leitura/escrita de registros da mesma empresa do usuário
- Mensagens e chamadas: usuário só vê as que enviou ou recebeu

**Autenticação por domínio**
- Login/cadastro por email + senha (auto-confirm ativo p/ demo)
- Trigger `handle_new_user`: ao cadastrar, extrai domínio do email → encontra empresa correspondente → cria registro em `funcionarios` automaticamente
- Se o domínio não existe em `empresas`, cadastro é bloqueado com mensagem clara

**Dados de demonstração (seed)**
- 2 empresas: `acme.com` (plano Pro) e `globex.com` (plano Free)
- 8 funcionários (4 por empresa, incluindo 1 admin cada) — perfis criados; usuários auth pré-criados via SQL com senha padrão demo
- 15 chamadas + 15 mensagens distribuídas entre os funcionários

## Frontend (TanStack Start)

**Rotas públicas**
- `/login` — entrar
- `/cadastro` — criar conta (valida domínio contra empresas existentes)

**Rotas autenticadas (`/_authenticated`)**
- `/` — Dashboard: resumo de mensagens não lidas, chamadas recentes, colegas online
- `/chat` — lista de conversas + painel de mensagens em tempo real (Supabase Realtime); indicador de "lida", anexos, status de presença ao lado dos nomes
- `/chat/$funcionarioId` — conversa específica
- `/chamadas` — histórico de chamadas + botão "ligar"; modal de chamada simulada (timer, controle mudo/desligar) que registra duração e qualidade no banco
- `/equipe` — diretório de funcionários da empresa com filtro por departamento e status
- `/salas` — salas de reunião de voz (criar / entrar / sair); participantes atualizados em tempo real
- `/admin` — apenas admins: gerenciar funcionários (ativar/desativar, promover a admin), ver dados da empresa, métricas de uso

**Componentes-chave**
- Sidebar persistente com navegação + avatar/status do usuário
- Indicador de presença (bolinha verde/amarela/cinza) sincronizado via Realtime
- Header com busca global e menu de perfil
- Toggle de status de presença (online/ocupado/ausente)
- Toasts para notificações de novas mensagens

## Credenciais de demo
Após o setup, mostro as credenciais (ex.: `admin@acme.com` / senha) para você testar imediatamente as duas empresas e ver o isolamento RLS funcionando.
