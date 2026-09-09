# Briefing de alinhamento — Ju / Fatto → plataforma operacional

Documento para **conversar com a Ju** e planejar a evolução **a partir do que já está no ar**, sem perder o trabalho feito.

Mapa técnico do atual: [MAPA-TELAS.md](./MAPA-TELAS.md).

---

## 1. O que a Ju pediu (áudio) — em uma frase

> Qualquer empresa controlar clientes e **compartilhar páginas específicas** com funcionários e clientes, com **acesso granular**, transparência onde faz sentido e **sigilo** sob o owner — inclusive contratos de vários tipos de relacionamento.

Isso redefine o produto: **não é só “sistema de assistentes virtuais”**.  
É uma **plataforma operacional multiempresa, multipessoa e orientada a relações**. A Fatto é a **primeira organização** a usar.

---

## 2. O que já construímos (e preservamos)

Já serve o operacional da Ju **hoje**:

- Ficha de cliente como mini-workspace (tarefas, financeiro/baixa, CRM, acessos…)
- Modo operação + grupos/tags definidos pela equipe (sem engessar vertical de mercado)
- Agenda com fuso + lembretes; tarefas com quadro e alertas de atraso
- Chat interno (página + flutuante)
- Financeiro com baixa protegida (comprovante ou senha Ju/admin)
- Share links read-only (`/compartilhar`)
- SOPs, onboarding, e-mail/WhatsApp em POC reutilizável
- Config: tipos de acesso + usuários compartilhados na mesma org

**Nada disso será apagado.** Vamos **refinar e encaixar** no modelo novo (Access Graph).

---

## 3. O salto de modelo (para alinhar linguagem)

Hoje o sistema pergunta sobretudo:

> “Qual é o cargo / AccessType deste usuário **nesta** org?”

Precisamos passar a perguntar:

> “Quem é a pessoa, a qual organização pertence, com quem a org se relaciona e **quais recursos** ela pode acessar?”

```text
Pessoa ──membership──► Organização ──► Equipes / Clientes / Terceiros / Contratos…
                              │
                              └── compartilhamentos explícitos por recurso
```

**RBAC sozinho não basta.** Combinar: RBAC + grupos + escopo + compartilhamento + regras por recurso + sensibilidade.

### Conceitos-alvo (nomes para a Ju)

| Conceito | Em português simples |
|----------|----------------------|
| Organização | Empresa no sistema (Fatto, Silva Contabilidade, cliente que vira org…) |
| Membership | “Mariana na Fatto como assistente” vs “Mariana na Empresa A como colaboradora” |
| Equipe | Time interno (Fiscal, Financeiro) |
| Grupo de acesso | Pacote de pessoas + recursos (ex.: Financeiro · Cliente Silva) |
| Cliente (conta) | Relacionamento operacional; pode apontar para outra Organização |
| Terceiro | Contador, advogado, fornecedor — não é só “parceira” no catálogo |
| Compartilhar | Ação de 1ª classe: quem / o quê / até quando / só ver ou colaborar |
| Sensibilidade | Operacional · Compartilhável · Confidencial · Owner-only |
| Primary Owner | Controle máximo do workspace (≠ “admin” genérico) |

---

## 4. Onde o produto atual encaixa nessa visão

| Visão nova | Ponte com o atual |
|------------|-------------------|
| Organização central | `Organization` (+ Kind Agency/Independent/Partner) |
| Papéis | `AccessType` + permissions — vira **template**, não a única verdade |
| Escopo por cliente | `AssignedClientIds` — embrião de escopo; depois vira shares/grupos |
| Mini-workspace cliente | `ClientDetailPage` — evolui abas com permissão por aba |
| Compartilhar | `ShareLink` → **portal do contratante** (`/s/:token`: msgs, docs, câmera); depois login autenticado + ACL |
| Hierarquia | `Pirâmide` / Employee.ManagerId = estrutura de comando, **não** substitui acesso |
| Tarefas de equipe | Quadro + colunas; depois Demanda → Tarefas + grupo de acesso |
| Contratos | PDF hoje; depois N partes + áreas privadas owner |
| Portal cliente | `/s/:token` hoje; depois login do cliente no mesmo dado, outra lente |

---

## 5. Prioridade de evolução (ordem sugerida)

Não fazer 29 telas novas do zero. Ordem que protege o produto:

1. **Documento + mapa** (este + MAPA-TELAS) — alinhamento Ju  
2. **Operação forte** (alertas, tarefas versáteis, ficha cliente) — valor imediato Ju/Fatto  
3. **Centro de Acessos (v1)** — Pessoas, convites, grupos de acesso **dentro da org**  
4. **Compartilhar autenticado** — evoluir ShareLink → ResourceShare (pessoa/equipe)  
5. **Cliente ↔ Organização** — relacionamento Fatto→Cliente; cliente vê só o compartilhado  
6. **Contratos N partes + áreas privadas**  
7. **Membership multi-org** — mesma pessoa em vários contextos  
8. **Terceiros + auditoria + authorize central (Access Graph)**

Cada etapa: migração + UI; features antigas continuam até a ponte estar estável.

---

## 6. Perguntas para a Ju (fechamento de escopo)

### Acesso e pessoas
1. Quem é o **Primary Owner** da Fatto no dia a dia (só você? + co-owners)?  
2. Além de assistentes, quais papéis reais entram no 1º mês (financeiro, qualidade, jurídico…)?  
3. Cliente deve **só visualizar** no começo, ou já **comentar / enviar comprovante / concluir tarefa**?

### Cliente e transparência
4. No exemplo “3 clientes · 1 negócio”, o cliente final vê só a **própria** página — confirmado?  
5. O que nunca pode vazar para o cliente (margem, custo interno, anotações da Fatto)?

### Tarefas / demandas
6. Prefere começar com **quadro de tarefas** (já existe) e depois “Demanda = pacote de tarefas”, ou Demanda já no próximo ciclo?  
7. A equipe inteira vê todas as tarefas do grupo, ou só as atribuídas + backlog do grupo?

### Contratos
8. Quais tipos de contrato vocês mais usam hoje? (Fatto↔cliente, cliente↔cliente-dele, terceiro…)  
9. Quem além do owner precisa **só ler** contratos no 1º release?

### Terceiros
10. Liste 3–5 tipos de terceiro que já trabalham com a Fatto (contador, designer…).

---

## 7. Princípios que não negociamos no código

1. **Nenhuma página decide segurança sozinha** — evoluir para `authorize(user, action, resource)`.  
2. **Transparência na UI** — “compartilhado com N” / “somente owner”.  
3. **Owner ≠ Admin** — admin não vê Owner-only por padrão.  
4. **Profissão é atributo** — a estrutura operacional (membership/escopo) é o que importa.  
5. **Refinar, não descartar** — tudo no [MAPA-TELAS.md](./MAPA-TELAS.md) continua válido até ter substituto.

---

## 8. Próxima conversa sugerida com a Ju

1. Validar seção 6 (perguntas).  
2. Escolher o **primeiro piloto de compartilhamento granular** (ex.: só Financeiro da ficha Tech Solutions).  
3. Confirmar se o nome “Prestadores” vira “Pessoas / Equipe” na navegação.

Enquanto isso, o time segue entregando valor no operacional (alertas, tarefas, ficha) **em cima da base atual**.
