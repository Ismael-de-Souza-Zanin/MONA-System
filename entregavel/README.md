# FattoVirtual — Pacote de demonstração

Para quem vai **testar o produto** (sem precisar saber desenvolvimento).

---

## Comece por aqui

1. Abra o arquivo **`COMECE-AQUI.txt`**
2. Siga os passos numerados na pasta:

| Arquivo | O que faz |
|---------|-----------|
| `1-Preparar-PC.bat` | **1ª vez / erro Docker+WSL** — ative WSL2 e oriente o Docker (rode como Administrador) |
| `2-Iniciar-FattoVirtual.bat` | Prepara tudo e abre o aplicativo |
| `3-Parar-FattoVirtual.bat` | Encerra o ambiente |
| `4-Resetar-Demo.bat` | Recomeça do zero se algo falhar |

Se aparecer erro de **Docker** e depois de **WSL**, isso é o Windows pedindo o WSL2 — use o passo 1 (Administrador) e reinicie se pedido.

Depois da primeira execução bem-sucedida, use o atalho **FattoVirtual** na Área de Trabalho.

### Login da demonstração

| | |
|--|--|
| E-mail | `ju@fattovirtual.com` |
| Senha | `Admin123!` |

---

## Documentos do produto (revisão)

| Arquivo | Conteúdo |
|---------|----------|
| [docs/MAPA-PAGINAS-E-FUNCIONALIDADES.md](./docs/MAPA-PAGINAS-E-FUNCIONALIDADES.md) | Mapa de telas |
| [docs/STATUS-E-SONDAGEM-MODULOS.md](./docs/STATUS-E-SONDAGEM-MODULOS.md) | Status + perguntas |
| [docs/ATIVIDADES-FATTO.md](./docs/ATIVIDADES-FATTO.md) | O que a FattoVirtual precisa fazer |
| [docs/PLANO-MVP.md](./docs/PLANO-MVP.md) | Plano para fechar o MVP |

---

## Avisos importantes

- **Não abra só o `.exe`** da pasta `app` — sem o passo 2 o sistema não conecta.
- Não é necessário instalar PostgreSQL, Node ou Visual Studio.
- É necessário o **Docker Desktop** (o passo 1 cuida disso).
- Pasta `scripts/` é uso interno do pacote — ignore no dia a dia.
