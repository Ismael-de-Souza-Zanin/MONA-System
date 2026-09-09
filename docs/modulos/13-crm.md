# CRM do cliente

## Objetivo
Registro de relacionamento ágil: a assistente registra o contato em segundos e vê o próximo passo sem caçar anotações soltas.

## O que é hoje
Na ficha `/clientes/:id` → aba **CRM**:

1. **Estágio** (Novo / Ativo / Vip / Em risco / Pausado)
2. **Próxima ação** + data
3. **Registrar contato** (tipo, canal, resumo, follow-up) → timeline
4. **Linha do tempo** de `ClientCrmEntry`
5. **Bloco de contexto** (notas longas que ficam à mão)

APIs: `POST/GET /clients/{id}/crm-entries`, `PATCH /clients/{id}/notes` (stage/next action).

## Próximos refinamentos
- Auto-log ao dar baixa / mudar status / SOP
- Lembrete na agenda a partir do follow-up
- Visão na fila `/operacao` dos próximos contatos do dia
