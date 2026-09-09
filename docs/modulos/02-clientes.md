# Clientes

## O que é hoje
Lista com status (Ativo/Hold/Aviso/Inativo), detalhe com abas (apps, acessos, CRM, financeiro, contrato, invoices, serviços), fuso do cliente.
Trabalho da atendente é **sempre centrado no cliente** (ficha, fila, tarefas, agenda vinculadas).

## Visões
| Quem | Visão |
|------|--------|
| Atendente / Ju | Operacional completo, por cliente e fila do dia |
| Conta compartilhada | Mesmo app, com permissões e clientes atribuídos |
| Cliente final (contratante) | **Portal** via link (`/compartilhar` → `/s/:token`): acompanhar, mensagens, enviar foto/comprovante do celular. Login próprio = evolução (Access Graph) |

## Regras conhecidas
- Multi-tenant por organização.
- Máquina de status com confirmações (e-mail, pendências, etc.).
- Cliente direto ≠ cliente-do-cliente (e-mail/WhatsApp só no direto).

## Perguntas essenciais
1. Quais campos são obrigatórios no cadastro?
2. Quem pode mudar status? Precisa aprovação?
3. Como você organiza clientes internacionais vs BR?

## Perguntas Fatto / Ju
1. Como você gera e controla **nota fiscal** hoje (para a Fatto e para clientes que pedem esse serviço)?
2. O que precisa aparecer no resumo do cliente para você não abrir 5 abas?
3. Credenciais e apps: o que é crítico vs “nice to have”?
4. Você precisa de pasta por cliente com links (Drive, Notion, etc.)?
5. Quais clientes precisam só **ver** (link) e quais precisam **entrar e interagir** na plataforma?
