## 2025-05-29 - Acessibilidade Baseada em Grupos de Rotas no Next.js
Learning: Em aplicações Next.js que usam Route Groups (ex: `(dashboard)`), a página raiz `src/app/page.tsx` pode ser apenas um template inicial que mascara o dashboard real. Sempre verifique a estrutura de pastas para encontrar o ponto de entrada real do usuário.
Action: Antes de aplicar mudanças de acessibilidade globais, identifique se o layout principal está em `src/app/layout.tsx` ou dentro de um Route Group específico como `src/app/(dashboard)/layout.tsx`.

## 2025-05-29 - Verificação de Formulários Acessíveis com Playwright
Learning: Testar a associação de `label` e `input` programaticamente garante que a acessibilidade não seja apenas visual. O uso de `document.activeElement` após clicar em um label é uma forma infalível de verificar se o `htmlFor` e `id` estão corretamente vinculados.
Action: Em scripts de verificação de UX, inclua um passo de clique no label seguido de uma checagem de foco no input correspondente.
