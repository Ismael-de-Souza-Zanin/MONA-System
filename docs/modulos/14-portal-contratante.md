# Portal do contratante

## Quem é
O **contratante** dos serviços das assistentes (cliente direto da Ju/Fatto) — precisa de acesso **mais simples e útil** que o painel da operação.

## Como acessa (hoje)
Link por token — sem login pesado:

1. Equipe gera em **Portal contratante** (`/compartilhar`, permissão `ShareLinks`) ou na ficha do cliente → aba **Portal**  
2. Contratante abre `/s/{token}` no celular ou PC  

Se o item não aparecer no menu: Personalizar menu / Tipos de acesso → liberar “Links de compartilhamento”.

### ACL do link (melhorado)
- Escopos em whitelist; validade padrão 90d (30d financeiro)
- Flags: mensagens, uploads, expor telefone/e-mail (padrão **off**)
- **Revogar** / reativar na lista de links
- Download de docs só nos escopos que listam documentos

Login autenticado do cliente = evolução futura (Access Graph); o link já entrega valor.

## O que o contratante faz
| Função | Detalhe |
|--------|---------|
| Acompanhar | Status, próximo passo, financeiro **A/B** (nunca C/margem), agenda, contratos, **relatório do período** (entregas + decisões visíveis) |
| Comunicar | Mensagens com a equipe (notifica owner) |
| Centralizar info | Hub mobile-first |
| Anexar | Arquivo da galeria **ou foto da câmera** (`capture=environment`) — comprovante/documento |

## Escopos do link
- `portal` — hub completo (recomendado)  
- `client` — resumo + msgs + docs  
- `finance` — financeiro + upload de comprovantes  
- `contracts` / `agenda` — fatias  

## APIs públicas
- `GET /api/v1/public/share/{token}`
- `POST .../messages`
- `POST .../documents` (multipart, câmera/arquivo)
- `GET .../documents/{id}`

## Lado da equipe
Ficha cliente → aba **Portal**: mensagens, documentos, gerar link.  
Notificações ao receber msg/doc do contratante.

## Próximos passos (com Ju)
1. Login leve (magic link / OTP) além do token  
2. WhatsApp bridge nas mesmas mensagens  
3. Pedir documento específico (“envie a NF”) com lembrete  
