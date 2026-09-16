# Financeiro

## Modelo (simples e completo)

Três **planos** — o cliente, a Fatto e a VA não compartilham a mesma gaveta.  
Detalhe: [ARQUITETURA-NUCLEO-COMPLETO.md](../ARQUITETURA-NUCLEO-COMPLETO.md).

| Plano | Ledger | Quem vê | Exemplo |
|-------|--------|---------|---------|
| **A — negócio do cliente** | **ClientAr** / **ClientAp** | Equipe + cliente (se compartilhado) | Cliente da manicure pagou; cliente paga o software |
| **B — Fatto ← cliente** | **Agency** | Equipe; cliente vê o que deve à Fatto | Mensalidade / retainer / extra |
| **C — Fatto → VA** | **AssistantPayout** (eleva `Payment.EmployeeId`) | ADM vê todas; VA só a sua | Repasse, hora, bônus |
| **Margem** | Calculada (B − C) | Só ADM | Não é livro para lançar; o cliente nunca vê |

Baixa continua eficiente: **comprovante ou senha Ju/admin** (`POST /payments/{id}/settle`).

## Invoices / notas
- `AgencyFee` — referência da Fatto
- `ClientCustomer` — NF gerada para o cliente do cliente (+ `counterpartyName`)

## O que é hoje
- Ficha do cliente → aba Financeiro com 3 cards + filtro por livro + registro com vencimento/terceiro
- Lista global `/financeiro`
- Campos: valor, descrição, ledger, counterparty, category, dueAt, settle/proof
- **Vínculos operacionais** (`PaymentLink`): 0..N de cada tipo — `todo`, `agenda`, `sop`, `sop-run`, `service`, `contract`
  - Criação: `POST /payments` com `links: [{ kind, entityId }]`
  - Atualizar: `PUT /payments/{id}/links`
  - Filtro dashboard: `GET /payments?linkedKind=todo&linkedId=…`
  - UX: chips + seletor tipo→item (prioriza itens do cliente quando há `clientId`)

## Perguntas Fatto / Ju
1. Precisa emitir NF-e dentro do sistema ou só registrar referência/arquivo?
2. Moedas (USD/EUR) na mesma tela?
3. Hold automático por inadimplência Agency?
4. Vincular baixa ClientAr automaticamente ao invoice ClientCustomer?
5. Quer o mesmo padrão de vínculos em notas/CRM e anexos de chat (além do financeiro)?
