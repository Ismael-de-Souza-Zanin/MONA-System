# Alinhamento — briefing original da Ju × o que já existe

**Regra:** refinar e completar; **não apagar** o que já funciona.

Última revisão: 2026-08-10.

## Onde criar usuários (teste ponta a ponta)

| Quem | Onde | Como |
|------|------|------|
| **Assistentes / co-admins** | Configurações → **Pessoas e acessos** | Conta principal cria login (e-mail + senha + tipo + clientes) |
| **Tipos de função** | Configurações → **Tipos de acesso** | Permissões checkbox a checkbox |
| **Clientes (contratantes)** | **Não** é login de equipe | Portal `/compartilhar` → link `/s/:token` (briefing: ver sem registrar) |

Fluxo de teste: Ju cria tipo → cria pessoa → abre janela anônima → login com o e-mail novo → validar menu/clientes.

## Mapa do briefing × status

| Pedido original | Status | Onde |
|-----------------|--------|------|
| Dashboard empresa (cards) | OK / evoluir | `/` |
| Dashboard usuário (meus clientes, financeiro, todo, agenda, solicitações) | Parcial | `/` + permissões |
| SOPs + pesquisa + scripts + só qualidade/Ju edita | OK→refinar ACL edição | `/sops` |
| Pirâmide (só conta principal) | Base | `/piramide` |
| Clientes + status cores + … alterar/excluir | OK | `/clientes` |
| Financeiro próprio + principal + tasks ativos | OK | `/financeiro` |
| Prestadores → resumo | Base | `/prestadores` |
| Empresas parceiras | Base | `/parceiras` |
| Base serviços | OK | `/servicos` |
| Contratos PDF | Base | `/contratos` |
| Onboarding + checklist padrão | OK | `/onboarding` |
| Agenda cores / alheias / categorias | OK→refinar filtros cor | `/agenda` |
| Apps (link + download) | Base | `/apps` |
| FAQ / suporte WhatsApp / Sair | OK | rodapé + menu |
| Config: empresa, usuário, tipos, compartilhados | OK (hub Pessoas) | `/configuracoes` |
| To-do colunas + comentários + notificar owner | OK→notificar owner | `/todos` |
| Link compartilhamento read-only | OK (+ portal msgs/docs) | `/compartilhar`, `/s/:token` |
| Resumo funcionário | Base | `/prestadores/:id` |
| Pop-up mudança status cliente (regras) | Parcial / aprofundar | clientes |
| Ficha cliente (apps, senhas, CRM, fin, contrato…) | OK | `/clientes/:id` |
| Tema escuro identidade Fatto | OK | toggle header + Config → Aparência |
| Desktop .exe | OK | `desktop/` |

## Gaps conscientes (próximos, sem descartar)

1. Solicitação à conta principal (card usuário) — canal formal ainda raso  
2. Edição SOP restrita a Qualidade/Ju por tipo de acesso (hoje: permissão Sops.Write)  
3. Notificar proprietário ao comentar todo (popup)  
4. Wizard completo de status Ativo→Hold/Aviso→Inativo com checks  
5. Login autenticado do cliente (Access Graph) — portal token permanece  
6. Membership multi-org / equipes — roadmap Access Graph  

Ver também: [BRIEFING-ALINHAMENTO-JU.md](./BRIEFING-ALINHAMENTO-JU.md), [MAPA-TELAS.md](./MAPA-TELAS.md).
