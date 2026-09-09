# Arquitetura SOP / Procedimentos — alinhamento PO × Fatto

Documento para revisão da Ju e da equipe. Data: 2026-08-10.

## Decisão de produto

| Camada PO | Na Fatto |
|-----------|----------|
| Núcleo operacional universal | **Sim agora** — seed `PackKey=universal` (cobrança, documento, cancelamento, follow-up, reunião, atraso, comunicação…) |
| Pacotes por ramo | **Futuro opcional** — templates importáveis, **não** sistemas diferentes nem enums de vertical no core |
| Camada específica da empresa/cliente | **Overlays** (`SopOverlay`: Rule / Condition / Exception / Channel) — sem clonar SOP |

Isso respeita o briefing: funcionalidades reutilizáveis; grupos/tags definidos pela operação; sem engessar mercado.

## SOP tipada (modelo)

Campos estruturados (além do texto):

- Tipo (`ProcedureType`), área (`Category` / `ApplicableArea`)
- Gatilho + **aliases de situação** (busca “cliente não pagou”)
- Responsável padrão, SLA em dias, resultado, versão
- Etapas com ação opcional (`open_path` → financeiro, agenda, chat…)
- Scripts, overlays, execuções (`SopRun`) com atraso e vínculos agenda/tarefa

## UX

- Entrada = hub (não lista enorme)
- Modo **rápido** (90% do tempo) vs **completo** (treino/gestão)
- Progressive disclosure: um próximo passo em destaque
- Métricas de uso/atraso/conclusão para quem gerencia

## SOP acionável — roadmap

1. **Agora:** botões “Abrir X”, checklist, overlays, registrar atraso  
2. **Próximo:** etapa cria tarefa/lembrete; scripts WhatsApp/e-mail com “registrar enviado”  
3. **Depois:** recomendações embutidas em Cliente / Financeiro / Onboarding / Funcionário + “solicitar acesso” se ACL bloquear  

## Chat na POC

Chat interno é canal de **comunicação interna** (uma das SOPs universais aponta para `/chat`).  
Correção: anexo de agenda usa `/agenda/events`. Para DM/grupo na demo, criar 2º usuário em Configurações.

## Como validar no site

1. `/sops` — hub centrado, chips de situação  
2. Buscar “cliente não pagou” → Cobrança  
3. Modo rápido → Iniciar → marcar passos → registrar atraso → finalizar  
4. Modo completo → adicionar overlay “Cobrar por WhatsApp” no cliente  
5. Chat consigo + mensagem (e 2º user para direto)

Login: `ju@fattovirtual.com` / `Admin123!`
