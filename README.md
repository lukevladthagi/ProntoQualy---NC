# ProntoQualy - Não Conformidades

Sistema web para registro, análise, tratamento e acompanhamento de não conformidades hospitalares.

O ProntoQualy organiza o fluxo de qualidade em etapas rastreáveis: registro da ocorrência, evidências, análise, plano de ação, execução, verificação de eficácia e encerramento.

## Principais Recursos

- Dashboard de indicadores de qualidade.
- Registro interno de não conformidades.
- Formulário público de notificação em `/notificar`.
- Gestão de evidências, análises, ações e verificações.
- Módulo de tratativas separado da tela da NC.
- Relatórios e indicadores por setor, gravidade e status.
- Configurações administrativas de setores, tipos, gravidades, responsáveis, metas, médicos, medicamentos e convênios.
- Importação e exportação em Excel nas configurações.
- Autenticação com Better Auth.
- Cadastro de usuário com setor principal.
- Base preparada para perfis `usuario`, `gestor` e `admin`, com setores permitidos por usuário.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Better Auth
- Neon/PostgreSQL
- Recharts
- XLSX

## Estrutura

```text
apps/web          Aplicação web Next.js
apps/mobile       Base mobile do template
config/migrations Migrations SQL manuais do projeto
publisher         Arquivos do template/plataforma
```

## Requisitos

- Node.js compatível com o projeto
- Corepack habilitado
- Yarn 4
- Banco PostgreSQL/Neon

## Variáveis de Ambiente

Crie `apps/web/.env.local` com as variáveis necessárias. Exemplo:

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:4000"
```

Em produção, ajuste `BETTER_AUTH_URL` para a URL real do servidor.

Não versionar arquivos `.env`.

## Instalação

```bash
corepack enable
corepack yarn install
```

## Rodando Localmente

```bash
corepack yarn workspace web dev
```

A aplicação sobe em:

```text
http://localhost:4000
```

## Scripts Úteis

```bash
corepack yarn workspace web typecheck
corepack yarn workspace web build
corepack yarn workspace web start
```

## Migrations

As migrations manuais ficam em:

```text
config/migrations
```

Migration atual de permissões de usuário:

```text
config/migrations/20260621_user_access_fields.sql
```

Ela adiciona ao usuário:

- `setor`
- `perfil`
- `setores_permitidos`

## Fluxo de Permissões

O desenho de permissões previsto é:

- `usuario`: acessa apenas o próprio setor.
- `gestor`: acessa os setores liberados por um admin.
- `admin`: acessa todos os setores e configura o sistema.

No cadastro, o usuário escolhe apenas o setor principal e entra como `usuario`. A promoção para gestor ou admin deve ser feita por uma tela administrativa.

## Login e Acesso

Rotas principais:

- `/account/signin`
- `/account/signup`
- `/account/forgot-password`
- `/account/reset-password`
- `/account/logout`

Observação: recuperação de senha depende da configuração de envio de e-mail no servidor.

## Formulário Público

Pessoas que apenas notificam uma ocorrência podem usar:

```text
/notificar
```

O tratamento da NC permanece restrito ao painel interno.

## Build de Produção

```bash
corepack yarn workspace web build
corepack yarn workspace web start
```

Por padrão, o script `start` usa o comportamento do Next.js. Defina porta via ambiente quando necessário:

```bash
PORT=4000 corepack yarn workspace web start
```
