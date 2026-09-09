# Atividades da FattoVirtual para prosseguir

Checklist do que a **FattoVirtual** precisa fazer (lado negócio + configuração), em paralelo ao desenvolvimento.

---

## Imediato (para validar este entregável)

- [ ] Abrir `entregavel/COMECE-AQUI.txt` e seguir os passos 1 → 2
- [ ] Na 1ª vez (ou se der erro Docker/WSL): botão direito em `1-Preparar-PC.bat` → Executar como administrador → reiniciar se pedido → abrir Docker Desktop até ficar pronto
- [ ] Depois: `2-Iniciar-FattoVirtual.bat`
- [ ] Entrar com o login da demonstração e percorrer: clientes → financeiro → tarefas → portal
- [ ] Usar o atalho **FattoVirtual** na Área de Trabalho nas próximas vezes
- [ ] Criar um **tipo de acesso** + um **login de assistente** e testar em janela anônima
- [ ] Gerar um **link de portal** para um cliente e abrir no celular
- [ ] Responder as **sondagens** em [STATUS-E-SONDAGEM-MODULOS.md](./STATUS-E-SONDAGEM-MODULOS.md)
- [ ] Se algo falhar: `4-Resetar-Demo.bat` e iniciar de novo

---

## Configuração de canais (quando for produção/real)

### WhatsApp (Meta)
- [ ] Criar App Meta + WhatsApp Business + Phone Number ID  
- [ ] Fornecer tokens / verify token para o host (`WhatsAppKit`)  
- [ ] Definir: número único da operação vs por atendente  
- [ ] Templates aprovados (janela 24h)

### E-mail
- [ ] Escolher SMTP ou OAuth (Gmail/Outlook)  
- [ ] Contas/remetente da operação  

### Suporte
- [ ] URL real do WhatsApp de suporte (hoje placeholder no menu)

---

## Dados e operação

- [ ] Cadastrar grupos/tags de clientes do jeito da equipe  
- [ ] Importar ou cadastrar clientes reais de piloto  
- [ ] Definir **tipos de acesso** (Assistente, Qualidade, Financeiro…) e permissões  
- [ ] SOPs prioritários do dia a dia (cobrança, onboarding, cancelamento…)  
- [ ] Checklist padrão de onboarding  

---

## Decisões de produto (bloqueiam ou direcionam o MVP)

- [ ] Confirmar regras de **mudança de status** de cliente  
- [ ] Portal: permanece só por link ou já precisa de login do contratante?  
- [ ] Escopo do financeiro (NF-e? multi-moeda?)  
- [ ] Quem edita SOP além da conta principal  
- [ ] Prioridade: contratos PDF vs WhatsApp real vs Access Graph  

---

## Segurança / go-live

- [ ] Trocar senha da conta seed e chaves JWT/credenciais em ambiente real  
- [ ] Definir URL pública da API (se o `.exe` apontar para servidor remoto)  
- [ ] Política de retenção de comprovantes e documentos do portal  

---

## Como devolver feedback

Preferência: marcar este arquivo + anotações no [STATUS-E-SONDAGEM-MODULOS.md](./STATUS-E-SONDAGEM-MODULOS.md) e no [PLANO-MVP.md](./PLANO-MVP.md), ou lista numerada por módulo.
