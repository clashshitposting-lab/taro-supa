# Recriar schema do projeto Taro

O banco do Supabase conectado (`opkoescrnnepcxlsiuny`) está **vazio** — nenhuma tabela em `public`. O `src/integrations/supabase/types.ts` herdado do repo está desatualizado e será regenerado automaticamente após a migration rodar.

## O que será criado em uma única migration

**Enum**
- `public.app_role` com valores `admin`, `moderator`, `user`

**Funções**
- `public.set_updated_at()` — trigger genérico para `updated_at`
- `public.has_role(uuid, app_role)` — SECURITY DEFINER (evita recursão em RLS)
- `public.handle_new_user()` — cria `profiles` + `user_roles('user')` em cada signup

**Tabelas (8)** com GRANTs + RLS conforme o SQL enviado:
- `profiles` — dono lê/insere/atualiza
- `user_roles` — usuário vê os próprios papéis
- `readings` — CRUD pelo dono
- `reading_previews` — SELECT/INSERT público (anon ok); UPDATE só pelo dono que reivindica
- `astral_charts` — CRUD pelo dono
- `offers` — SELECT público quando `is_active = true`
- `purchases` — dono lê/insere
- `user_entitlements` — dono lê

**Triggers**
- `updated_at` em `profiles`, `readings`, `astral_charts`, `user_entitlements`
- `on_auth_user_created` em `auth.users` → cria profile + role 'user'

**Seed**
- 1 linha em `offers` (`pacote-despertar`, R$ 49,90)

## Depois da migration

1. O `types.ts` será regenerado pelo sistema.
2. **Auth a configurar manualmente no painel Supabase:**
   - Email/senha habilitado, sem auto-confirm
   - Google OAuth (posso ativar via `configure_social_auth` se quiser)
   - Recomendado: ligar "Leaked password protection" (HIBP)
3. Bootstrap do admin: abrir `/api/public/bootstrap-admin` uma vez após o app subir (a rota já existe no repo).

## Observações

- O código no repo importa de `@/integrations/db/...` (cliente antigo de outro projeto). Não vou mexer nisso nesta etapa — foco é só rodar a migration do schema. Se quiser, em um passo seguinte eu realinho os imports para `@/integrations/supabase/...` (cliente atual).
- Não vou criar Edge Functions; o stack é TanStack Start e a rota de bootstrap já está como server route.

Confirma que posso rodar a migration?