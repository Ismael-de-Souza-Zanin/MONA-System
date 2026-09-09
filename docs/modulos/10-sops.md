# Procedimentos (SOPs)

## Princípio de produto
A página **não** é uma biblioteca de documentos. É um lugar onde a assistente chega com um problema e sai com o **próximo passo**.

Packs por ramo (contabilidade, clínica…) são **opcionais no futuro** — o core fica com o **núcleo universal** + overlays da empresa/cliente, sem engessar vertical de mercado.

## Arquitetura (camadas)

```
SOP BASE (procedimento tipado)
        │
   ┌────┴────┐
Pack opcional   Overlays empresa/cliente
   └────┬────┘
        ▼
   Execução (run) → métricas / agenda / tarefas
```

**Não duplicar** “Cobrança Cliente A/B/C”: use overlay (regra, canal, condição, exceção).

## O que existe hoje

| Capacidade | Status |
|------------|--------|
| Hub centrado (busca situação, continuar, frequentes, áreas) | Sim |
| Aliases de situação (“cliente não pagou”) | Sim |
| Tipo / área / gatilho / SLA | Sim |
| Modo rápido vs completo | Sim |
| Progressive disclosure na execução | Sim |
| Overlays empresa/cliente | Sim (CRUD básico) |
| Runs + atraso + métricas 30d | Sim |
| Vínculo opcional agenda/tarefa no run | API |
| Ações de passo (`open_path`) | Sim |
| Seed núcleo universal | Sim |
| Packs por ramo | Documentado / futuro |
| Automações pesadas (criar todo/agenda sozinho) | Próximo |
| Recomendações embutidas em Cliente/Financeiro | Próximo |
| Scripts por canal/tom + “registrar enviado” | Próximo |

## Hub `/sops`
1. Busca: situação, não só título  
2. Chips “O que aconteceu?”  
3. Continue de onde parou (máx. 3)  
4. Usados com frequência  
5. Explorar por área  
6. Gestão (métricas) só quem escreve SOP  

## APIs
- `GET /sops/hub`, `GET /sops/metrics`
- `GET /sops?q=&category=&procedureType=&clientId=&serviceId=`
- `POST/PUT /sops`, `POST /sops/{id}/overlays`, `POST /sops/{id}/runs`
- `PATCH /sops/runs/{id}` (atraso, agenda, todo), complete/toggle steps  

## O que cabe agora vs visão PO
**Cabe e já ajuda o dia a dia:** hub, busca por situação, execução rápida, overlays, métricas, núcleo universal.  
**Depois (com Ju):** packs de ramo como templates importáveis; recomendações contextuais nas outras telas; automações de etapa; permissão “solicitar acesso” na etapa.

Ver: `docs/ARQUITETURA-SOP-PROCEDIMENTOS.md`
