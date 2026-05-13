# copyminer-studio

App web interna do time MK pra **gerar prompts** Veo (P1 + Extend) e Nanobana, baseado no conhecimento acumulado da skill `copyminer-fé`.

A app **não dispara geração** — só entrega o prompt pronto pra colar no Flow.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Auth magic link + Postgres + Storage)
- OpenAI GPT-4o (vision)
- Deploy: Coolify

## Setup local

1. Cria projeto no Supabase
2. Roda as migrations em `supabase/migrations/0001..0007*.sql` no SQL editor (na ordem)
3. Copia `.env.example` → `.env.local` e preenche
4. `npm install`
5. `npx tsx scripts/seed.ts` → popula formatos, montes, psicologia, ~870 copies (importadas do `COPIES-USADAS.md` da skill)
6. `npm run dev` → http://localhost:3000

## Rotas

- `/` — Dashboard (4 cards)
- `/login` — Magic link
- `/gerador-video` — Upload imagem ref → análise GPT-4o → prompts P1+Extend
- `/gerador-imagem` — Form → prompt Nanobana
- `/biblioteca` — Formatos / Psicologia / Regras
- `/historico` — Tabela paginada com filtros (851+ copies)

## Convites

MK cria usuários via Supabase Admin (Auth → Users → Add user → enviar invite). Membro recebe email com magic link.

## Deploy Coolify

- Build via `Dockerfile` (Next.js standalone)
- Subdomain: `copyminer.creioemtesenhor.com` (a configurar)
- Env vars no Coolify:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `NEXT_PUBLIC_APP_URL` (URL final pública)

## Templates

Os templates de prompt (P1, Extend, Nanobana) ficam em `lib/templates.ts` — fonte de verdade copiada do `skills/copyminer-fe/scripts/batch-v9-extend.js` + `data/character-jesus-reference.md`.
