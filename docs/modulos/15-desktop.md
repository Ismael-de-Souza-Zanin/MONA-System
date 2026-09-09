# Desktop (canal PC / .exe)

## Não confundir com `/apps`

| Conceito | O que é |
|----------|---------|
| **`/apps`** | Módulo de **catálogo de apps do cliente** (já no produto / Ju) |
| **Desktop** | **Canal de entrega**: mesma UI React + mesmas APIs `api/v1`, empacotada em `.exe` Windows |

Nada do operacional web é descartado. O `.exe` só hospeda a SPA.

No build desktop (`VITE_DESKTOP=1`) a SPA usa **HashRouter** (`#/financeiro`) para funcionar em `file://`. A web continua com BrowserRouter.

## Arquitetura

```text
frontend/ (React+Vite) ──► web (nginx / Vite)
                       └──► desktop/ (Electron) → FattoVirtual-*.exe
                              │
                              └── HTTP → ASP.NET api/v1 (mesmo backend)
```

## Demonstração completa (API + .exe) — recomendado para a Ju

Pré-requisito: **Docker Desktop** rodando.

| Ação | Como |
|------|------|
| Um clique (raiz do repo) | `Iniciar-Demonstracao.bat` |
| Ou | `desktop/demo/Iniciar-Demonstracao.bat` |
| Parar API/DB | `desktop/demo/Parar-Demonstracao.bat` |
| Via npm | `cd desktop && npm run demo` / `npm run demo:stop` |

O script sobe só **Postgres + API** (`docker-compose.desktop.yml`, portas `5433` / `5080`), espera a API e abre o `.exe` em `desktop/release/`.  
Login seed: `ju@fattovirtual.com` / `Admin123!`.

Após `npm run build:win`, a pasta `desktop/release/demo/` recebe cópia do kit (scripts + `LEIA-ME.txt`).

Detalhe: [desktop/demo/README.md](../../desktop/demo/README.md).

## Como rodar (dev)

1. API no ar (`:5080`) — use o script de demo ou `docker compose -f docker-compose.desktop.yml up -d --build`.
2. Em `desktop/`: `npm install` → `npm run dev` (abre janela Electron apontando ao Vite).

Opcional: `FATTO_DEV_URL=http://localhost:5174 npm run dev` se a porta do Vite mudar.

## Como gerar o instalador Windows

```bash
cd desktop
npm install
# opcional: API de produção no build
set VITE_API_BASE=https://seu-servidor/api/v1
npm run build:win
```

Artefatos em `desktop/release/`:

- instalador NSIS (`FattoVirtual-0.1.0-setup.exe`)
- portable (`FattoVirtual-0.1.0-portable.exe`)
- pasta descompactada: `release/win-unpacked/FattoVirtual.exe`

## Configuração da API no .exe

1. **Build-time:** `VITE_API_BASE` (default do script: `http://localhost:5080/api/v1`).
2. **Runtime:** em Configurações, bloco “App desktop — URL da API” (grava em `localStorage`).

Web continua com `/api/v1` relativo (proxy Vite / nginx) quando `VITE_API_BASE` não está definido.

## Próximos passos (fora deste ciclo)

- Auto-update (`electron-updater`)
- Assinatura de código Windows
- Pipeline CI Windows (GitHub Actions)
