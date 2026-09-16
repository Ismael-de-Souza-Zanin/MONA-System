# Núcleo operacional completo — simples, mais completo que o mercado

**Regra:** uma cadeia de trabalho, três planos de dinheiro, três lentes de relatório.  
Não criamos um ERP. Não apagamos o que a Fatto já usa. Especializamos por **overlay e pack**, não por sistema por ramo.

Última atualização: 2026-09-11.

---

## 1. A cadeia (o que a pesquisa chama de unidade fundamental)

Quase toda rotina de VA é a mesma sequência. O MONA modela isso de ponta a ponta:

```text
entrada (inbox / reunião / portal)
  → interpretação + contexto do cliente
  → SOP / ponto de atendimento
  → trabalho (tarefa e/ou agenda)
  → evidência + decisão
  → dinheiro no plano certo
  → próximo passo
```

**Agenda ≠ tarefa** permanece. São ciclos de vida distintos, com vínculo opcional.

| Objeto | Papel | Já existe |
|--------|--------|-----------|
| Conversa | WhatsApp, e-mail, portal, chat | Parcial (canais soltos) |
| Reunião | Compromisso na agenda + ata | Agenda; ata/decisão rasos |
| Decisão | O que ficou combinado, dono, prazo | Novo (log, não documento solto) |
| Tarefa | Trabalho a concluir | TodoItem |
| SOP + run | Como fazer + prova de execução | Forte |
| Ponto de atendimento | Canal + SLA + intake + escalonamento daquele serviço | Embrião em ServiceItem |
| Evidência | Comprovante, SOP run, mensagem, decisão | Espalhada; padronizar |

Uma reunião **não substitui** a tarefa. Ela **nasce** decisões e tarefas. Um SOP **não substitui** o Kanban. Ele diz *como* e registra *que foi feito*.

---

## 2. Três planos de dinheiro — nunca misturar

Hoje os 3 livros cobrem bem o **negócio do cliente** e a **mensalidade da Fatto**. Falta o plano da **VA**, separado, para a ADM ver margem sem o cliente ver custo interno.

| Plano | Quem vê | O que é | Livro / objeto |
|-------|---------|---------|----------------|
| **A — Negócio do cliente** | Equipe + cliente (se compartilhado) | Cliente recebe de terceiros / paga fornecedores | `ClientAr` / `ClientAp` (já existe) |
| **B — Fatto ← cliente** | Equipe; cliente vê o que deve à Fatto | Retainer, horas extras, serviços | `Agency` + invoice `AgencyFee` (já existe) |
| **C — Fatto → VA** | Só ADM / conta principal | Repasse, hora, bônus da assistente | Ledger `AssistantPayout` (eleva `Payment.EmployeeId`) |
| **Margem** | Só ADM | B − C no período | Calculado. **Nunca** vira livro que a VA ou o cliente lançam |

Regras que não se negociam:

1. Cliente **nunca** vê plano C nem margem.
2. VA vê o **próprio** plano C, não o das colegas (salvo ADM).
3. Plano A não entra no P&L da Fatto — é operação gerida.
4. Tempo/retainer explica o plano B; não substitui os livros.
5. Baixa continua: comprovante ou senha da conta principal.

Isso é o que FocalVA e Marlow não fazem: eles administram a agência; nós também **operamos o dinheiro do cliente** sem misturar com o ganho da VA.

---

## 3. Três lentes — mesmo fato, três relatórios

Não são três produtos. São **filtros** sobre a mesma evidência (tarefa concluída, SOP run, reunião, tempo, pagamento).

Horizontes: **hoje · semana · mês · por cliente**.

| Lente | Pergunta | Vê | Não vê |
|-------|----------|----|--------|
| **Cliente** (portal) | “O que foi feito por mim?” | Entregas, SLA, pendências, plano A/B combinado, decisões que o afetam | Margem, plano C, anotações internas, senhas |
| **ADM** | “Como o time e a casa estão?” | Carga, atraso, cobertura, consumo de retainer, planos B+C, margem, saúde da conta | Microatividade tipo screenshot |
| **VA** | “Como eu estou?” | Minha fila, meus clientes, minhas horas, meu plano C, meus SLAs | Margem da casa, payout das outras |

Métricas que importam (pesquisa §8) — e as que evitamos sozinhas:

- Vale: follow-ups concluídos, FRT/SLA, faturas no prazo, retainer consumido, handoff pronto, Early/OnTime/Late.
- Perigoso sozinho: número bruto de tarefas, mensagens/hora, screenshots.

O dashboard atual (contagens) vira **capa**. O relatório operacional é a profundidade.

---

## 4. Reuniões e decisões de negócio

Módulo **não** é videoconferência. É o que a pesquisa descreve: a reunião termina e o sistema guarda o que importa.

1. Evento de agenda (já existe) marcado como reunião.
2. Ata curta: pauta, presentes, próximo encontro.
3. **Decisões** (objeto): texto, dono, prazo, cliente, visível ou não no portal.
4. Cada decisão pode abrir tarefa e/ou lembrete.
5. A ADM e o cliente (se marcado) veem o log no relatório do período.

Isso diferencia de ClickUp (docs soltos) e de Marlow (resumo do dia sem decisão rastreável).

---

## 5. Atendimento por ramo — sem virar um sistema por vertical

O core **não** ganha enum “clínica / jurídico / imobiliário”.  
O que o ramo muda é o **ponto de atendimento** + SOP overlay + pack.

**Ponto de atendimento** (configuração do serviço na conta):

- Canal (WhatsApp, e-mail, telefone, portal)
- Janela e SLA
- Intake (o que capturar: serviço, local, urgência, documento…)
- Escalonamento (“nunca responda X sem aprovação”)
- SOP padrão + overlays do cliente
- Tom / templates

Packs (`PackKey` que já existe na SOP) são **templates importáveis**:

| Pack | Pontos típicos (exemplos) |
|------|---------------------------|
| `universal` | Cobrança, documento, cancelamento, follow-up, reunião, atraso, comunicação — **já no seed** |
| `atendimento` | Intake, remarcação, “já paguei”, incidente, orçamento |
| depois, sob demanda | `saude`, `juridico`, `imobiliario`, `home-services`… |

Uma clínica não ganha um MONA diferente. Ganha pack + overlays (PHI = acesso mínimo, já no roadmap de segurança).

---

## 6. Completos frente aos concorrentes — sem copiar o peso deles

| Capacidade | FocalVA | Marlow | ClickUp / Asana | HoneyBook | MONA |
|------------|---------|--------|-----------------|-----------|------|
| Contratos, retainer, portal, tempo | Sim | Sim | Não nativo | Comercial | Sim (B + tempo) |
| Folha / tracker / screenshot | Parcial | Forte | Time tracking | Não | Não copiamos vigilância |
| Operar o negócio do cliente | **Não** (eles declaram) | Fraco | Não | Não | **Sim** (ficha + plano A + SOP) |
| Inbox → trabalho | Não | Parcial | Não | Automação de venda | Sim (MVP) |
| SOP executável + overlay | Não | Treino | Docs | Não | **Já temos** |
| 3 lentes de relatório | Portal + tempo | Resumo / score | PM | Portal comercial | Cliente / ADM / VA |
| Dinheiro A / B / C separado | Só B (+ payroll) | B + payroll | Não | B comercial | **A + B + C + margem** |
| Reunião → decisão | Não | Daily summary | Docs | Não | Módulo explícito |
| Ramo sem ERP | Não | Não | Não | Não | Ponto + pack |

A frase que defendemos: *toda a operação de cada cliente, sem misturar contextos — e sem misturar dinheiro.*

---

## 7. O que não construir (simplicidade)

- Contabilidade geral / NF-e emissor (referência basta até a Ju pedir).
- Folha internacional completa (plano C + export primeiro).
- Call center / Zoom próprio.
- CRM tipo Salesforce.
- Um Kanban por vertical.
- Relatório que a VA preenche à mão no fim do mês — o relatório **sai da evidência**.

---

## 8. Encaixe no que já está no ar

| Já no código | Evolui para |
|--------------|-------------|
| Todo + Agenda | Cadeia + reunião/decisão; filtros; evidência no relatório |
| SOP + overlay + run | Ponto de atendimento + pack `atendimento`; ACL de edição |
| Payment 3 livros + EmployeeId | Plano C explícito; margem ADM; ocultar C no portal |
| Dashboard KPIs | Capas das 3 lentes; drill dia/semana/mês/cliente |
| Portal `/s/:token` | Relatório do cliente (entregas + decisões visíveis) |
| ServiceItem + grupos/tags | Ponto de atendimento na ficha, sem enum de vertical |
| Modo operação | Fila do dia da lente VA |

---

Ver também: [BRIEFING-ALINHAMENTO-JU.md](./BRIEFING-ALINHAMENTO-JU.md), [ARQUITETURA-SOP-PROCEDIMENTOS.md](./ARQUITETURA-SOP-PROCEDIMENTOS.md), mapa Ju em `entregavel/docs/MAPA-JU-IMPLANTADO-MVP-DEPOIS.md`.
