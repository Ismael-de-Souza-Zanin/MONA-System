# Status dos módulos e sondagem — FattoVirtual

Para cada módulo: **o que foi desenvolvido**, **o que o briefing original pedia**, e **perguntas** para a FattoVirtual confirmar expectativa.

Legenda de status: **OK** · **Parcial** · **Base** · **POC**.

---

## Dashboard
| | |
|--|--|
| **Desenvolvido** | Cards/KPIs e atalhos; visão conforme permissões |
| **Esperado (briefing)** | Cards empresa + cards usuário (meus clientes, financeiro, todo, agenda, solicitações à conta principal) |
| **Status** | Parcial |
| **Sondagem** | Quais cards são indispensáveis na 1ª tela do dia? “Solicitações à conta principal” deve ser fila formal ou basta o chat/alertas? |

## Clientes
| | |
|--|--|
| **Desenvolvido** | Lista A–Z, status com cores, grupos/tags, busca, ficha completa (CRM, financeiro 3 livros, acessos, portal…) |
| **Esperado** | Mesmo + wizard rígido de mudança de status (checks de e-mail, pendências, etc.) |
| **Status** | OK (wizard status: Parcial) |
| **Sondagem** | Confirmar regras Ativo→Hold/Aviso→Inativo. Campos obrigatórios no cadastro? |

## Financeiro
| | |
|--|--|
| **Desenvolvido** | Livros Agency / AR / AP, vencimento, baixa com comprovante ou senha admin, vínculos a tarefas/agenda/SOP/serviço |
| **Esperado** | Financeiro próprio + da conta principal; tasks de clientes ativos sem pagamento no mês |
| **Status** | OK |
| **Sondagem** | NF-e dentro do sistema ou só referência? Moedas além de BRL? |

## Tarefas
| | |
|--|--|
| **Desenvolvido** | Kanban, colunas editáveis, comentários, prazos, alertas de atraso |
| **Esperado** | Filtro por usuário (principal vê todos); notificar proprietário ao comentar |
| **Status** | OK → falta popup “notificar proprietário” |
| **Sondagem** | Demanda = pacote de tarefas já no MVP ou depois? |

## Agenda
| | |
|--|--|
| **Desenvolvido** | Eventos, categorias, fusos, lembretes, follow-up → tarefa |
| **Esperado** | Cores por pessoa/cliente; ver só minhas / alheias (conta principal) |
| **Status** | OK → filtros de cor a aprofundar |
| **Sondagem** | Precisa ver dois fusos lado a lado com frequência? |

## Procedimentos (SOPs)
| | |
|--|--|
| **Desenvolvido** | Hub por situação, pesquisa/filtros, scripts, overlays, runs, métricas |
| **Esperado** | Só qualidade + conta principal editam |
| **Status** | OK (ACL = permissão Sops.Write) |
| **Sondagem** | Confirmar quais tipos de acesso podem editar vs só executar |

## Prestadores / Pirâmide
| | |
|--|--|
| **Desenvolvido** | Cadastro, resumo, pirâmide por ManagerId (só conta principal) |
| **Esperado** | Página resumo rica (contrato, escala, cor…) |
| **Status** | Base |
| **Sondagem** | Prestador = sempre usuário do sistema, ou também só cadastro operacional? |

## Parceiras / Serviços / Contratos / Apps / Onboarding
| | |
|--|--|
| **Desenvolvido** | CRUD básico; serviços tipados + vínculo cliente; onboarding com templates; apps catálogo |
| **Esperado** | Conforme briefing original |
| **Status** | Serviços/Onboarding OK; demais Base |
| **Sondagem** | Prioridade de PDF de contrato e catálogo de apps neste MVP? |

## Chat / Alertas / E-mail / WhatsApp
| | |
|--|--|
| **Desenvolvido** | Chat interno completo; alertas; e-mail/WhatsApp com host pronto (Meta/SMTP = Fatto) |
| **Esperado** | Canais de operação diária |
| **Status** | Chat/Alertas OK; E-mail/WhatsApp POC |
| **Sondagem** | Número WhatsApp único ou por atendente? Alertas automáticos para WhatsApp? |

## Portal do contratante
| | |
|--|--|
| **Desenvolvido** | Links com escopo, validade, flags (msgs/upload/contato), revogar; hub `/s/:token` com docs e câmera |
| **Esperado** | Link de visualização (evoluiu para hub colaborativo controlado) |
| **Status** | OK |
| **Sondagem** | Login autenticado do cliente no MVP ou continua só token? |

## Configurações / Pessoas
| | |
|--|--|
| **Desenvolvido** | Empresa, perfil, tipos de acesso, criar logins de equipe, tema, URL API desktop |
| **Esperado** | Usuários compartilhados + tipos com permissões |
| **Status** | OK |
| **Sondagem** | Co-admin pode criar outros logins além da conta principal? |

## Desktop
| | |
|--|--|
| **Desenvolvido** | `.exe` Windows (Electron) + scripts de API local |
| **Esperado** | App no PC usando as mesmas APIs |
| **Status** | OK |
| **Sondagem** | Assinatura de código / auto-update já neste ciclo? |
