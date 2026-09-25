---
name: mona-design-system
description: Evoluir a interface MONA no projeto FattoVirtual, preservando sua identidade, tokens, personalização e componentes compartilhados. Use em alterações visuais do frontend React deste produto.
---

# Design system MONA

No repositório FattoVirtual, leia `frontend/src/styles/README.md`, `tokens.css` e as classes relevantes de `semantic.css` antes de alterar a aparência. A identidade atual é roxo, rosa e laranja sobre superfícies claras ou escuras; referências antigas ao verde não são a fonte de verdade.

- Tokens `--mona-color-*`, `--mona-type-*`, `--mona-radius-*` e `--mona-space-*` alimentam os componentes. Os presets e overrides de `shared/theme` precisam continuar funcionando.
- Use `shared/ui` para botões, campos, cartões, modais e cabeçalhos. Tailwind organiza layout; classes semânticas `.mona-*` definem aparência nova em `semantic.css`. `compat.css` é uma ponte legada, não um padrão para copiar.
- Preserve a assinatura de pastas, superfícies arredondadas, linhas discretas e CTA em gradiente. Reserve ornamentação para entrada e navegação; mantenha dados e ações legíveis e próximos.
- Em CSS aninhado, escreva nomes completos de elementos/modificadores. `&__elemento` e `&--variante` não funcionam neste pipeline.
- Cores de categorias e colunas vindas da API são dados; não substitua suas cores por constantes de marca. Estados também precisam de rótulo/ícone.
- Não simule capacidades com links para a própria página, contagens inventadas ou filtros sem dados reais. Preserve permissões e contratos da API.

Para alterações responsivas, leia `docs/skills/mona-responsive-parity/SKILL.md`. A matriz de recursos está em `docs/MOBILE-PARITY.md`. Valide com build, lint e inspeção das telas afetadas em claro/escuro; não declare validação de produção quando usou a fake API.
