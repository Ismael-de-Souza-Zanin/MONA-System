# Curadoria das imagens MONA

Fonte local: `frontend/src/chat/` (79 PNGs) e `Document 3.pdf` (catalogo descritivo). Essa pasta contem **referencias visuais e ilustracoes**, nao codigo do chat, e permanece fora do commit por ser um acervo bruto de aproximadamente 93 MB. Os quatro recortes em `frontend/src/assets/illustrations/` entram no app. Eles aparecem nos cabecalhos operacionais do desktop, inclusive quando ha dados; os tres primeiros tambem aparecem nos respectivos estados vazios.

## Selecao para uso pontual

Os arquivos abaixo sao recortes com transparencia, sem nomes, metricas ou controles ficticios. Servem como ilustracao secundaria, sem substituir dados ou controles reais. Os nomes de origem identificam o acervo local; apenas os quatro arquivos vinculados na coluna "No app" sao versionados.

| Tema | Origem local | No app | Aplicacao sugerida |
| --- | --- | --- | --- |
| Agenda | `00_13_43 (3)` | — | Primeira configuracao de agenda ou estado sem compromissos. |
| Tarefas | `00_13_43 (4)` | — | Lista vazia ou celebracao apos concluir todas as tarefas; nunca substituir o checkbox interativo. |
| Arquivos | `00_13_43 (5)` | — | Biblioteca de documentos vazia. |
| Documentos | `00_13_43 (6)` | [documents.png](../frontend/src/assets/illustrations/documents.png) | Cabecalho de Contratos e estado vazio. |
| Financeiro | `00_13_44 (8)` | [finance.png](../frontend/src/assets/illustrations/finance.png) | Cabecalho financeiro; nao representa valores ou tendencias. |
| Clientes/equipe | `00_13_45 (9)` | [clients.png](../frontend/src/assets/illustrations/clients.png) | Cabecalho de Clientes e estado vazio; nao usar como avatar real. |
| Chat | `00_13_46 (10)` | [chat.png](../frontend/src/assets/illustrations/chat.png) | Cabecalho e conversa vazia no chat interno. |

### Prioridade de aplicacao

1. **Chat interno, documentos e clientes:** ha correspondencia visual direta e pouco risco de confundir ilustracao com dado. Exibir como recorte compacto no cabecalho desktop e nos estados vazios.
2. **Tarefas e financeiro:** manter numeros, graficos e checks reais em componentes da interface. No financeiro, o recorte aparece apenas no cabecalho desktop.
3. **Agenda:** prioridade baixa; a tela ja e rica visualmente. O calendario ilustrado pode ajudar no primeiro acesso, mas nao em dias comuns.

## Referencia, nao asset de producao

- `00_11_16` a `00_11_49`: estudos abstratos de conexao, crescimento e superficies. A progressao cromatica pode orientar tokens e materiais, mas as formas sao grandes demais para telas operacionais.
- `00_12_13` a `00_12_16`: exploracoes de marca, login e composicoes institucionais. O logo oficial do app ja existe em `frontend/src/assets/`; nao substituir por letras geradas.
- `00_12_29` a `00_12_31`: relatorios, indicadores, badges e avatares ilustrativos. Usar como referencia de hierarquia visual, nao como controles.
- `00_12_52` a `00_13_27`: cenas de modulos com pastas, agenda, equipe, contratos, tarefas e graficos. A maioria tem fundo branco fixo, texto, horarios, nomes ou numeros. Nao encaixa de modo confiavel nos temas claro/escuro e nao deve aparecer em paginas com dados reais.
- `00_13_08` a `00_13_27`: algumas cenas sem texto podem inspirar estados de sucesso. A versao transparente selecionada acima e preferivel, por ocupar menos area e nao criar um novo bloco de destaque.
- `00_13_42 (1)` e `(2)`: formas gradientes transparentes. Excluir da interface operacional; acrescentariam decoracao sem semantica.
- `00_13_56` e `00_13_58`: quatro pranchas com dez conceitos por imagem, numeracao e titulos embutidos. Servem para revisao do conjunto, nao para recorte automatico ou exibicao no app.
- `00_14_15` a `00_14_17`: fundos e fitas. Ha numeracao `01/10` a `10/10` embutida em todos os exemplos observados; nao usar como fundo do produto sem uma nova versao limpa.

## Bloqueios especificos

- A imagem de relatorios `00_12_29 (1)` exibe `+142%`, `R$ 84,2 mil`, `1.482` clientes e outros valores inventados. A de financeiro `00_12_55 (7)` tambem traz saldo ficticio. **Nunca inserir em dashboard ou relatorios vivos.**
- As cenas de equipe e clientes incluem retratos e nomes inventados; nao usar como registros ou fotos de perfil.
- Mockups de telas de login, dashboard e agenda representam layouts estaticos, nao interfaces clicaveis. Implementar a hierarquia em React/CSS com dados da API.
- `00_11_16`, `00_11_25` e `00_11_49 (2)` sao duplicatas binarias. Manter os originais fornecidos, mas nao importar mais de uma.
- Os PNGs transparentes apresentam pequenas franjas claras nas bordas em fundo escuro. Antes de producao, conferir recorte nos temas claro e escuro e gerar derivados otimizados apenas dos escolhidos.

## Regra para integracao

As imagens selecionadas sao **ilustracao**, nao icones de botao, graficos ou dados. Limitar a um recorte compacto por cabecalho ou estado vazio, com texto e acao reais em HTML, `alt=""` se decorativas e `loading="lazy"` fora da primeira dobra. Testar em 360px, 768px e desktop nos temas claro e escuro. Nao recriar banners motivacionais fora da pagina inicial, conforme a decisao de produto ja tomada.
