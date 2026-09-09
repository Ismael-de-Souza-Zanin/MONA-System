# Briefing Ju — operacional Fatto (sem engessar o produto)

## Princípio de produto

O sistema **não embute especificidade de mercado** (cleaning, manicure, jurídico…) como regra do negócio da plataforma.

- Tipos/grupos de clientes são **definidos pelas assistentes** (grupos + tags).
- Conforme os clientes entram, a equipe ganha organização — agrupando do jeito que trabalha.
- Funcionalidades são **reutilizáveis** (fila, fuso, e-mail, WhatsApp, SOPs, alertas).
- Foco imediato: **operacional da Ju / Fatto**. Depois ela comercializa a mesma base.

## Evolução (áudio Ju + alinhamento)

A Fatto caminha para **plataforma multiempresa / multipessoa** (equipe, clientes, terceiros, compartilhamento granular).  
Isso **não apaga** o que já existe — refine e encaixa no Access Graph.

→ Documento de alinhamento: [`../BRIEFING-ALINHAMENTO-JU.md`](../BRIEFING-ALINHAMENTO-JU.md)  
→ Mapa de telas atuais: [`../MAPA-TELAS.md`](../MAPA-TELAS.md)

## O que a Ju descreveu (contexto, não catálogo)

Assistentes atendem quem terceiriza: fechamento, dúvidas, controle, admin/backoff, mensagens rápidas.  
Há clientes internacionais, quem não pode atender durante o serviço, quem precisa de docs, etc.

Isso informa **UX e prioridades**, não cria enums de vertical no core.

## Como o sistema modela (hoje)

| Necessidade | Implementação |
|-------------|---------------|
| Agrupar clientes | `ClientGroup` + tags |
| Fila do dia | `/operacao` |
| Tarefas de equipe | Quadro com colunas editáveis + alertas de atraso |
| Agenda | Lembretes + alerta se passou do horário |
| Baixa financeira | Comprovante ou senha Ju/admin |
| Compartilhar (v1) | Links `/s/:token` |
| Serviços por cliente | Catálogo + especificidades + vínculo `ClientService` |
| Chat | Direto, grupo, consigo; anexar entidades com ACL |
| WhatsApp | Host pronto (status/webhook/send); Meta com a Ju |
| Escala futura | `Organization.Kind`; depois Membership / Access Graph |

## Foco agora (antes de comercializar)

1. Ju usar no dia a dia (fila, grupos, alertas, agenda, tarefas, WhatsApp/e-mail POC).
2. Revisar checklist: [`../REUNIAO-JU-MENU-SERVICOS-CHAT-WHATSAPP.md`](../REUNIAO-JU-MENU-SERVICOS-CHAT-WHATSAPP.md).
3. Responder perguntas do briefing de alinhamento (acessos, portal cliente, contratos).
4. Evoluir compartilhamento e centros de acesso **sem descartar** o mapa atual.
