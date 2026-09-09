# Central de alertas / notificações

## O que é hoje
Lista com marcar como **vista** e **resolver** como Early / OnTime / Late; sino no header; prioridade.

Tipos gerados automaticamente:
- `agenda` — lembrete antes do evento
- `agenda_overdue` — compromisso passou do horário
- `todo_overdue` — tarefa com prazo vencido (relembra ~12h)
- `todo` — comentário etc.

## Perguntas essenciais
1. Quais tipos de alerta são críticos (som/badge vermelho)?
2. Depois de “vista”, ainda precisa aparecer até “resolvida”?
3. Quer filtros por cliente, tipo, atraso?

## Perguntas Fatto / Ju
1. O que mais te atrapalha: volume de alertas ou falta de alerta certo?
2. “Resolvido atrasado” deve gerar métrica de qualidade?
3. Quer escalar alerta não resolvido para outra atendente / você?
