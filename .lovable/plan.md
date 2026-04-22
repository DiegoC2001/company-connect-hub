## Análise

Construir página `/contatos` rica: tabela + filtros + ações de chamada/mensagem + diálogos + chat lateral + realtime de presença + notificações.

Atenção: backend de chamadas e Storage ainda não existe. Vou estruturar o frontend completo apenas para o que já existe no DB (mensagens_chat, funcionarios, status_presenca via realtime), e deixar chamadas como UI funcional + dialog "aguardando" sem persistir em `chamadas` ainda — porque o fluxo correto será via server functions (próximo passo). Isso evita quebrar RLS e mantém o passo coeso.

## Escopo deste passo

✅ **Implementado agora:**

1. Listagem real de `funcionarios` da empresa (excluindo o próprio usuário).
2. Filtros: busca por nome, select de departamento (derivado dos dados), select de status, botão limpar.
3. Tabela com avatar, nome, cargo, departamento, badge de presença, último acesso (com `date-fns` formatação relativa).
4. Skeleton loading + empty state.
5. Realtime de presença: subscription no canal `empresa:<empresa_id>:presenca` ouvindo `postgres_changes` em `funcionarios` (filtro por empresa_id) — atualiza a query do TanStack Query.
6. Ações por linha: Chamada Voz, Chamada Vídeo, Mensagem. Voz/Vídeo desabilitadas se status = `offline` ou `ausente` (permitidas em `online`/`ocupado`).
7. **CallDialog**: modal "Aguardando resposta..." com timer crescente, botão Cancelar, botão "Deixar mensagem" que fecha o dialog e abre o chat lateral. Não cria registro em `chamadas` ainda — placeholder até as server functions de chamada.
8. **ChatSheet**: Sheet lateral com histórico de mensagens entre o usuário e o contato selecionado (query em `mensagens_chat`), input para enviar mensagem (insert real), realtime no canal `user:<auth.uid()>:mensagens` ouvindo INSERTs em `mensagens_chat` filtrados por `destinatario_id=auth.uid()` — atualiza histórico. Marca mensagens como lidas ao abrir.
9. Toast de notificação quando chega nova mensagem com chat fechado (via mesmo canal user).

⏸️ **Adiado (próximo passo de chamadas):**

- Persistência em `chamadas` + server function `iniciar-chamada`/`finalizar-chamada`.
- WebRTC real (vídeo/voz). Por ora o dialog é "fake call".
- Upload de arquivo no chat (precisa criar bucket Storage com RLS — também próximo passo).
- Indicador "digitando..." (precisa de canal broadcast separado — próximo passo junto com WebRTC).

Vou deixar comentários `// TODO` claros marcando onde plugar a server function de chamada e o upload.

## Arquitetura de arquivos

```
src/routes/_authenticated/contatos.tsx         (página principal)
src/components/contatos/
  ContatosTable.tsx                            (tabela + skeleton + empty state)
  ContatosFilters.tsx                          (busca + selects + limpar)
  PresencaBadge.tsx                            (badge colorido reusável)
  CallDialog.tsx                               (modal aguardando resposta)
  ChatSheet.tsx                                (sheet de chat 1:1)
src/hooks/
  useFuncionarios.ts                           (query + realtime de presença)
  useMensagensChat.ts                          (query + realtime + send)
```

Hooks usam **TanStack Query** (já configurado no `__root.tsx` via `QueryClientProvider`). Query keys: `['funcionarios', empresaId]`, `['mensagens', userId, contatoId]`.

## Detalhes técnicos

### Realtime — convenção de canais

As políticas RLS de `realtime.messages` exigem prefixos `empresa:<empresa_id>:*` ou `user:<user_id>:*`. Usarei:

- `empresa:<empresaId>:presenca` para mudanças em `funcionarios` (qualquer um da empresa).
- `user:<userId>:mensagens` para mensagens dirigidas ao usuário atual.

Mas atenção: `postgres_changes` em si usa autenticação de banco (RLS da tabela alvo). O canal name só precisa passar pela política de subscribe. Vou nomear conforme as RLS criadas.

### Filtro de status no realtime

`postgres_changes` aceita `filter: 'empresa_id=eq.<id>'` — perfeito.

### date-fns

Já instalado. Usar `formatDistanceToNow` com locale `ptBR`.

### Status badge

Cores via classes utilitárias controladas por mapa, sem hardcode em componente — usar `bg-green-500/15 text-green-600` etc. (são tokens utilitários Tailwind padrão, aceitáveis para indicadores semânticos não cobertos por design tokens). Ou criar tokens `--status-online` etc. em `styles.css`. Vou adicionar tokens semânticos para presença em `styles.css` para ficar correto.

### Chat — marcar como lida

Ao abrir o sheet, `update mensagens_chat set lida=true where destinatario_id=auth.uid() and remetente_id=contato.id and lida=false`.

### Notificação toast de mensagem nova

Subscription global montada no layout `_authenticated` (não na página) para funcionar mesmo fora de `/contatos`. Vou criar `src/hooks/useGlobalMessageNotifications.ts` e chamar dentro de `AuthenticatedLayout`.

## Tokens de status no styles.css

Adicionar:

```css
--status-online: oklch(0.7 0.18 145);
--status-ocupado: oklch(0.6 0.22 25);
--status-ausente: oklch(0.78 0.16 80);
--status-offline: oklch(0.6 0.02 260);
```

e registrar em `@theme inline` como `--color-status-*`.

## Entregáveis

1. `styles.css` — tokens de status.
2. Hooks: `useFuncionarios`, `useMensagensChat`, `useGlobalMessageNotifications`.
3. Componentes: `PresencaBadge`, `ContatosFilters`, `ContatosTable`, `CallDialog`, `ChatSheet`.
4. `contatos.tsx` reescrito com tudo plugado.
5. `AuthenticatedLayout` — adiciona o hook global de notificações.
6. Comentário `// TODO` nos pontos de integração com server functions de chamada e Storage.

## Pré-requisito do usuário (lembrete)

Para testar de verdade, é preciso ter ≥2 funcionários na mesma empresa (mesmo `dominio_email`). Aviso na entrega.
