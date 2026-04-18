

## Análise

Preciso construir o esqueleto do app: auth + layout autenticado com sidebar/header + rotas protegidas + RBAC para admin. Banco já está pronto (funcionarios, user_roles, has_role, get_minha_empresa).

## Arquitetura de rotas (TanStack Router)

```text
src/routes/
  __root.tsx                    (já existe — adicionar QueryClientProvider + AuthProvider)
  index.tsx                     (redireciona / → /login ou /dashboard)
  login.tsx                     (pública, redireciona se já autenticado)
  forgot-password.tsx           (pública)
  reset-password.tsx            (pública — obrigatória para fluxo de reset)
  _authenticated.tsx            (layout: sidebar + header + Outlet, guarda beforeLoad)
  _authenticated/
    dashboard.tsx
    contatos.tsx
    chamadas.tsx
    mensagens.tsx
    salas.tsx
    configuracoes.tsx
    _admin.tsx                  (guarda extra: hasRole('admin'))
    _admin/
      usuarios.tsx              (Gerenciar Usuários)
```

## AuthContext

`src/contexts/AuthContext.tsx` expõe:
- `session`, `user` (auth.users), `funcionario` (linha de `funcionarios`), `empresaId`, `isAdmin`, `loading`
- `signIn`, `signOut`, `updatePresenca(status)`
- Fluxo correto: `onAuthStateChange` PRIMEIRO, depois `getSession()`. Buscas de `funcionarios`/`user_roles` via `setTimeout(0)` dentro do callback para evitar deadlock do Supabase.

Esse contexto é injetado no router context (padrão TanStack auth-guards) para uso em `beforeLoad`.

## Componentes de layout

- `src/components/layout/AppSidebar.tsx` — shadcn `Sidebar` com `collapsible="icon"`. Itens fixos + item condicional "Gerenciar Usuários" se `isAdmin`. Usa `Link` do TanStack com `activeProps`.
- `src/components/layout/AppHeader.tsx` — `SidebarTrigger`, busca placeholder, dropdown de status de presença (online/ocupado/ausente — atualiza coluna `status_presenca` em `funcionarios`), badge de notificações (placeholder por enquanto), avatar com dropdown (nome, cargo, logout).
- `src/components/layout/AuthenticatedLayout.tsx` — usado dentro de `_authenticated.tsx`: `SidebarProvider` + sidebar + `<main>` com header + `<Outlet/>`.

## Páginas iniciais (placeholders enxutos)

Cada rota autenticada renderiza um cabeçalho + card vazio com descrição do que virá. Evita "página em branco" mas deixa claro que é stub. Login/forgot-password/reset-password são funcionais de verdade.

## Guardas

- `_authenticated.tsx`: `beforeLoad` checa `context.auth.isAuthenticated`; se não, `throw redirect({ to: '/login', search: { redirect: location.href } })`.
- `_authenticated/_admin.tsx`: checa `context.auth.isAdmin`; se não, redireciona para `/dashboard`.
- `login.tsx`: se já autenticado, redireciona ao destino.

Como o auth do Supabase é assíncrono no client, o `AuthProvider` mostra um splash enquanto `loading=true` e só então monta o `RouterProvider` com o context populado — assim `beforeLoad` sempre vê estado coerente.

## Estilo

- Mantém tokens já em `src/styles.css` (slate baseColor). Acentos azul-violeta serão refinados num passo posterior — agora uso `bg-primary`/`text-primary` semânticos. Sem cores hardcoded.
- Sidebar colapsável (icon mode) para telas menores; foco em desktop conforme pedido.

## Detalhes técnicos

1. Adicionar `@tanstack/react-query` (já é peer-dep do TanStack Start setup; verificar e adicionar se necessário) — usado para queries futuras de funcionarios/chamadas. Por ora, `AuthContext` usa Supabase direto.
2. `router.tsx` passa a usar `createRootRouteWithContext<{ auth: AuthState }>()` — exige editar `__root.tsx` para usar `createRootRouteWithContext`.
3. `src/main.tsx` (ou onde o router é montado) — embrulha `<RouterProvider>` com `<AuthProvider>` e injeta `auth` via `router.update({ context: { auth } })` no re-render do provider. Vou verificar onde `RouterProvider` é instanciado antes de implementar.
4. Realtime de presença e notificações ficam para passos seguintes (já há políticas RLS para canais `empresa:<id>:*` e `user:<id>:*`).
5. Reset de senha: `signUp`/`resetPasswordForEmail` usam `redirectTo: window.location.origin + '/reset-password'`.
6. `index.tsx` atual (placeholder) será substituído por um componente que usa `Navigate` para `/dashboard` (auth) ou `/login`.

## Pré-requisitos do usuário (importante)

Para conseguir logar, é preciso ter ao menos 1 linha em `empresas` cujo `dominio_email` bata com o email do primeiro usuário (o trigger `handle_new_user` bloqueia domínios não cadastrados). Recomendo cadastrar p.ex. `acme.com` antes de criar o primeiro usuário pela tela de cadastro — ou eu posso adicionar uma rota `/signup` simples agora (não foi pedida explicitamente; aviso na entrega para você criar via SQL).

## Entregáveis deste passo

1. `AuthContext` + provider
2. Rotas: `login`, `forgot-password`, `reset-password`, `_authenticated` layout, 6 páginas autenticadas, `_admin/usuarios`
3. Sidebar + Header + AuthenticatedLayout
4. Atualização de `__root.tsx` e `router.tsx` para context tipado
5. Atualização de `index.tsx` removendo placeholder
6. Sem chamadas reais ainda em chamadas/mensagens/realtime — só estrutura

