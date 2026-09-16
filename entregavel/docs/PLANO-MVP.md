# Plano e ajustes para concluir o MVP — FattoVirtual

Mapa para a Ju (implantado / MVP / depois): [MAPA-JU-IMPLANTADO-MVP-DEPOIS.md](./MAPA-JU-IMPLANTADO-MVP-DEPOIS.md).

Objetivo do MVP: a equipe da FattoVirtual **opera o dia a dia** (clientes, tarefas, agenda, financeiro, SOPs, portal do contratante) com estabilidade local/desktop, sem depender ainda do Access Graph completo. Continuam no MVP deste ciclo: continuidade (SOP + acessos + handoff), horas/retainer e inbox unificado. Segurança profunda (audit + authorize central) fica desenhada; o ciclo da Ju vê só o endurecimento visível.

---

## Já entregue (base do MVP)

- Autenticação, tipos de acesso, criação de logins de equipe  
- Clientes + ficha (CRM, financeiro 3 livros, portal)  
- Tarefas (kanban) + agenda + alertas  
- Financeiro com baixa protegida + vínculos operacionais  
- SOPs tipados (hub / execução)  
- Chat interno  
- Portal contratante com ACL de link (revogar, flags, validade)  
- Desktop Windows + stack API Docker  
- Tema claro/escuro identidade Fatto  

---

## Ajustes prioritários para fechar o MVP

### P0 — Bloqueadores de uso diário
1. Wizard completo de **status do cliente** (regras e checks do briefing)  
2. Popup **notificar proprietário** ao comentar tarefa  
3. ACL de edição de SOP por tipo (Qualidade / conta principal)  
4. Estabilizar smoke E2E (login → cliente → pagamento → portal) em CI ou script do kit  

### P1 — Valor alto, pouco risco
5. Filtros de agenda (só minhas / alheias / cores)  
6. Solicitações à conta principal (fila simples no dashboard)  
7. Melhorias UX portal (confirmação de envio, lista de links na ficha)  
8. Auto-update ou canal claro de nova versão do `.exe`  

### P2 — Integrações reais
9. WhatsApp Meta (tokens FattoVirtual)  
10. E-mail SMTP/OAuth de produção  
11. Assinatura do instalador Windows  

### Fora do MVP (roadmap)
- Access Graph (membership multi-org, shares autenticados, sensibilidade Owner-only)  
- Login do contratante além do token  
- Contratos N partes  
- Demanda = pacote de tarefas  

---

## Critérios de aceite do MVP

| Critério | Como validar |
|----------|----------------|
| Assistente opera cliente do dia | Modo operação + ficha |
| Financeiro não perde ativo | Lista “sem registro no mês” + baixa |
| Contratante envia comprovante | Link portal + upload |
| Segunda conta com escopo | Criar login + clientes atribuídos |
| App no PC | `Iniciar-FattoVirtual.bat` + smoke OK |

---

## Próxima reunião sugerida com a FattoVirtual

1. Percorrer o [mapa](./MAPA-PAGINAS-E-FUNCIONALIDADES.md) e marcar “ok / ajustar / não precisa”  
2. Fechar respostas da [sondagem](./STATUS-E-SONDAGEM-MODULOS.md)  
3. Priorizar P0 da lista acima  
4. Definir data-alvo de piloto interno (equipe real + 3–5 clientes)  
