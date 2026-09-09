# FattoVirtual

Monorepo do sistema FattoVirtual: React (Vite) + ASP.NET Core API + PostgreSQL.

## Estrutura

```text
frontend/   # React + TypeScript + Tailwind
backend/    # ASP.NET Core (Api, Application, Domain, Infrastructure)
docker-compose.yml
```

## Pré-requisitos

- Node 22+
- .NET 10 SDK
- Docker Desktop (recomendado)

## Subir local com um comando (Docker)

> **Importante:** o Docker precisa do **Docker Desktop no Windows** aberto.  
> Dentro do WSL puro o comando `docker` normalmente não existe até ativar *Settings → Resources → WSL Integration*.  
> Prefira rodar `.\start-local.bat` no PowerShell/Windows, não só no WSL.

Com o Docker Desktop aberto, na raiz do projeto:

```powershell
.\start-local.bat
```

Ou:

```powershell
.\start-local.ps1
```

O script sobe `db` + `api` + `web`, espera a API e abre http://localhost:5173.

Para parar:

```powershell
.\stop-local.bat
```

- Web: http://localhost:5173  
- API: http://localhost:5080  

Usuário seed:

- Email: `ju@fattovirtual.com`
- Senha: `Admin123!`

## Desenvolvimento local

1. Suba só o banco:

```bash
docker compose up db -d
```

2. API:

```bash
cd backend
dotnet ef database update --project src/FattoVirtual.Infrastructure --startup-project src/FattoVirtual.Api
dotnet run --project src/FattoVirtual.Api --launch-profile http
```

3. Frontend:

```bash
cd frontend
npm install
npm run dev
```

O Vite faz proxy de `/api` para `http://localhost:5080`.

## Auth

JWT (access + refresh). Permissões por `AccessType`. Conta owner (`isOwner`) tem acesso total, inclusive pirâmide e financeiro global.

## Arquitetura (escalável + integrações)

- **DDD em camadas:** `Domain` (regras/timezone) → `Application` (portas) → `Infrastructure` (EF, Identity, adapters) → `Api`
- **Integrações externas:** portas em `Application/Abstractions/Integrations` + pacote portátil `packages/EmailKit` (Gmail/Outlook/SMTP/DevFile).
- **Tempo global + viagem:** UTC na persistência; fuso casa vs fuso viagem/detectado; agenda e tarefas usam o fuso efetivo.
- **Agenda ≠ Tarefas:** compartilham cliente/contexto; vínculo opcional; ciclos de vida distintos.
- **SOPs:** passos críticos, execução guiada com progresso, scripts e resultado esperado.
- **E-mails (POC):** `/emails` — caixa demo + envio programado (EmailKit). Guia: `packages/EmailKit/NEXT_STEPS.md`.
- **WhatsApp (POC):** `/whatsapp` — inbox/envio (WhatsAppKit). Guia: `packages/WhatsAppKit/NEXT_STEPS.md`.
- **Arquitetura kits:** `docs/INTEGRATIONS.md`
- **Docs por aba + perguntas Ju:** `docs/modulos/` (inclui briefing Ju)
- **Modo operação:** `/operacao` — fila unificada; grupos de clientes definidos pela equipe
- **Organização flexível:** `ClientGroup` + tags (sem catálogo de vertical de negócio no produto)
- **Escala SaaS:** `Organization.Kind` (Agency | Independent | Partner); foco atual = operacional Fatto/Ju
- **Workspace:** menu in-place, sidebar recolhível, abas flutuantes, alertas, chat interno.
