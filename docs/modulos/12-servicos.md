# Base de serviços

## Objetivo
Cadastro do que a equipe entrega, com especificidades e vínculo por cliente — base para comunicação assistente↔cliente e anexos no chat.

## Modelo
- **ServiceItem:** título, descrição, categoria, especificidades[], notas equipe, notas cliente, ativo.
- **ClientService:** cliente ↔ serviço, status (Active/Paused/Ended), notas custom, assistente responsável.

Sem verticais de mercado fixas — organização livre + tags/grupos de cliente.

## UI
`/servicos` — criar serviço, listar com clientes vinculados, “Vincular cliente”.

## APIs
- `GET/POST/PUT /services`
- `POST /services/{id}/assign-client`
- `GET /clients/{id}/services`

## Próximos refinamentos
- Aba Serviços no detalhe do cliente.
- Editar/pausar vínculo na UI.
- Usar `clientFacingNotes` em templates WhatsApp/e-mail.
