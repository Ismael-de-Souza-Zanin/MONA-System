# Demo completa (Desktop + API)

Para a Ju / prospect ver o **mesmo produto** no `.exe` com backend real.

## Pré-requisitos

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e **Running**
2. Repositório FattoVirtual clonado (a stack faz `build` da API a partir do código)
3. App desktop gerado: `cd desktop && npm run build:win`

## Um clique

Dê duplo clique em:

`desktop/demo/Iniciar-Demonstracao.bat`

Isso:

1. Sobe Postgres (`:5433`) + API (`:5080`) via `docker-compose.desktop.yml`
2. Espera a API responder
3. Abre o `.exe` em `desktop/release/` (portable ou `win-unpacked`)

Login seed: **`ju@fattovirtual.com`** / **`Admin123!`**

Parar: `Parar-Demonstracao.bat`

## PowerShell

```powershell
cd desktop\demo
.\Start-FattoDemo.ps1          # sobe + abre exe
.\Start-FattoDemo.ps1 -Rebuild # rebuild das imagens
.\Start-FattoDemo.ps1 -NoLaunch
.\Stop-FattoDemo.ps1
```

## Pacote em `release/demo/`

Após `npm run pack:demo` em `desktop/`, a pasta `release/demo/` recebe cópia destes scripts + um `LEIA-ME.txt` ao lado do instalador — útil para zip de demonstração (ainda precisa do clone + Docker para build da API).
