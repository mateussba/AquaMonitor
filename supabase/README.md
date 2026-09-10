# Supabase

Esta pasta concentra os arquivos de infraestrutura do banco.

## Antes de criar tabelas

1. Crie o projeto no painel do Supabase.
2. Copie `.env.example` para `.env.local` e inclua a URL e a chave **publishable**.
3. Instale a CLI do Supabase e execute `supabase init` neste diretório.
4. Para cada mudança de banco, crie uma migration com `supabase migration new nome_da_mudanca`.

## Segurança

- Não exponha chaves `service_role` no React.
- Toda tabela exposta em `public` deve ter RLS habilitado.
- As políticas devem limitar os dados do usuário autenticado; não use apenas `TO authenticated`.
