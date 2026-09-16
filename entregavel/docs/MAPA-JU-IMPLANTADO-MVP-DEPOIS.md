# Mapa para a Ju — o que já existe, o que vem no MVP, o que vem depois

**Para:** Ju / equipe FattoVirtual  
**Data:** 11/09/2026  
**Premissa:** o que já atende o dia a dia **permanece**. Nada disso será apagado. O MONA é o nome da plataforma; a Fatto é a primeira empresa a usar.

Inventário fiel das telas: [MAPA-PAGINAS-E-FUNCIONALIDADES.md](./MAPA-PAGINAS-E-FUNCIONALIDADES.md).  
Modelo completo (dinheiro, relatórios, reuniões, ramos): [docs/ARQUITETURA-NUCLEO-COMPLETO.md](../../docs/ARQUITETURA-NUCLEO-COMPLETO.md).

---

## 1. Já implantado — pode usar hoje

### Operação do dia
- Login da equipe (e-mail + senha)
- Dashboard com indicadores e atalhos
- **Modo operação** — fila do dia e grupos de clientes (os grupos são de vocês, sem engessar tipo de negócio)
- **Clientes** — lista, cores de status, busca, grupos/tags
- **Ficha do cliente** — resumo, apps, senhas, CRM, financeiro, contrato, invoices, serviços, portal
- **Tarefas** — quadro, colunas, prazo, comentários, vínculo com agenda
- **Agenda** — eventos, categorias, fuso casa/viagem, lembretes
- **Alertas** — lido e resolução no prazo (cedo / na hora / atrasado)
- **Financeiro** — três livros (mensalidade Fatto · o cliente recebe · o cliente paga); baixa com comprovante ou senha da conta principal
- **Procedimentos (SOPs)** — hub por situação, modo rápido/completo, scripts, regras por cliente
- **Onboarding** — checklist e modelos
- **Serviços** — catálogo e vínculo com o cliente
- **Chat interno** — direto, grupo, consigo, anexos
- **Portal do contratante** — link com prazo e permissões (ver, mensagem, enviar foto/arquivo)
- **Configurações** — empresa, perfil, tipos de acesso, pessoas/logins, aparência
- **App no computador** — o mesmo sistema, em `.exe`

### Já existe, ainda raso (estrutura pronta)
- Contratos (lista + PDF)
- Prestadores e resumo (inclui pagamentos da pessoa — ainda não é o “ganho da VA” separado)
- Pirâmide (só conta principal)
- Empresas parceiras
- Catálogo de apps
- FAQs

### Já existe em demonstração (ainda não é o canal real)
- E-mails — caixa e envio programado (ainda sem Gmail/Outlook de produção)
- WhatsApp — inbox e envio de teste (número real da Fatto vem depois)

---

## 2. Próximos passos — ainda no MVP

Tudo abaixo **refina** o que já existe ou nasce ao lado. Legenda: **refino** · **novo**.

### Tarefas, agenda, SOP e reuniões (o esquema do dia)
| Item | Tipo | Em português simples |
|------|------|----------------------|
| Agenda continua diferente de tarefa | refino | Compromisso no tempo ≠ trabalho a concluir; o vínculo opcional permanece |
| Reunião + decisões | novo | A call acaba: ata curta, o que ficou combinado, quem faz, até quando |
| Decisão vira tarefa | novo | Sem copiar à mão para o quadro |
| SOP como “como fazer” + prova | refino | Execução gera evidência no relatório; só Qualidade / conta principal edita |
| Pacote de passagem | novo | Outra assistente assume: preferências + SOPs + senhas + pendências + decisões abertas |
| Cliente ativo visível | novo | Para não responder no cliente errado |
| Wizard de status + ciclo de senha | refino | Checks antes de Hold/Inativo; revogar acesso quando a conta ou a pessoa sai |

### Relatórios — dia, semana, mês, por cliente
**Uma base de fatos. Três jeitos de olhar.** Ninguém preenche planilha no fim do mês.

| Quem | O que vê | Para quê |
|------|----------|----------|
| **Cliente** (portal) | O que foi feito, prazos, pendências, decisões que o afetam, o dinheiro **dele** e o que deve à Fatto | Validar o trabalho da VA sem microgerenciar |
| **ADM / Ju** | Desempenho do time, carga, atraso, retainer, **ganho da casa**, **repasse das VAs**, margem | Entender se a operação fecha |
| **VA** | A fila dela, os clientes dela, as horas dela, o **próprio** ganho | Ver o próprio desempenho |

Horizontes em todos: **hoje · esta semana · este mês · este cliente**.

Números que importam: entregas, no prazo / atrasado, follow-ups, consumo do pacote de horas, SLAs.  
Não usamos sozinhos: “quantas tarefas clicou” ou captura de tela o dia inteiro.

### Dinheiro em três gavetas (mais a margem, só da ADM)
Os três livros de hoje **continuam**. Separação explícita:

| Gaveta | Quem vê | O quê |
|--------|---------|-------|
| **Negócio do cliente** | Equipe + cliente (se combinado) | Cliente recebeu de alguém / pagou fornecedor — já existe |
| **Fatto cobra o cliente** | Equipe; cliente vê a mensalidade | Retainer, extras — já existe (livro Agency) |
| **Fatto paga a VA** | ADM vê todas; VA vê só a sua | Repasse / hora / bônus — **separado**, o cliente nunca vê |
| **Margem da Fatto** | Só ADM | O que entrou da conta menos o que saiu para a VA — **calculado**, não é um quarto livro para lançar |

Tempo e pacote de horas **explicam** a mensalidade; não misturam com o dinheiro que o cliente fatura no salão / clínica / escritório.

### Inbox e horas (já combinados)
- Uma caixa por cliente: WhatsApp + e-mail + portal; mensagem vira tarefa, reunião ou pendência
- Timer ou lançamento; pacote consumido; alerta de estouro
- Avisar a conta principal ao comentar tarefa; filtros da agenda; pedidos à conta principal; versão do `.exe`

### Atendimento nos diferentes ramos
Não vamos fazer “um sistema de clínica” e “um de imobiliária”.  
Vamos fazer **pontos de atendimento** (canal, horário, o que perguntar, para quem escalar, qual SOP) e **pacotes** que a equipe liga na conta:

- Já no núcleo: cobrança, documento, reunião, atraso, follow-up, comunicação
- Neste ciclo: pack de **atendimento** (orçamento, remarcação, “já paguei”, ninguém veio)
- Depois, se a carteira pedir: saúde, jurídico, imóveis… **em cima do mesmo núcleo**

### Aparência
- Telas novas no design system (mesmos botões/cards). Verde Fatto permanece.

### Segurança que a equipe vê agora
Wizard de status, quem edita SOP, ciclo de senha.  
Auditoria completa de cada clique e motor central de permissão: **desenhados, vêm depois**.

---

## 3. Depois do MVP — integrações e automações

- WhatsApp oficial (número da Fatto) e e-mail de produção
- Assinatura do instalador Windows
- Automação com guarda: mensagem → fluxo, com aprovação se o risco for alto
- Login do contratante (além do link)
- Compartilhar um pedaço da ficha com pessoa ou equipe
- Contratos com várias partes; demanda = pacote de tarefas
- Histórico de quem viu / mudou / exportou / revogou
- Folha internacional completa, NF-e emissor, central telefônica, IA enviando sozinha — **fora** até a Ju pedir
- Mais packs de ramo conforme a carteira (não antes)

---

## Como ler este mapa numa conversa

1. Seção 1: **ok / ajustar / não precisa**.
2. Seção 2: o esquema (tarefa + agenda + SOP + reunião), as **três gavetas de dinheiro**, os **três relatórios** e o atendimento por ponto/pack são o que nos deixa mais completos que agenda+Kanban ou que um “sistema só da agência”.
3. Seção 3 não some: integrações reais e plataforma multiempresa, sem misturar com o que precisa para operar agora.
