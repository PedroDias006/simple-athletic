# SIMPLE ATHLETIC

Base em Next.js App Router, TypeScript e Tailwind CSS. Requer Node.js 20.9 ou superior.

Execute `npm ci` e `npm run dev`. Para produção: `npm run build` e `npm start`.
Valide os tipos com `npm run typecheck`.

As quatro rotas são pré-renderizadas. Componentes de servidor, Inter hospedada pelo Next e imagens locais evitam dependências de terceiros durante a navegação. SVGs são ilustrações demonstrativas, sem scripts. Ao trocar por fotografias, use WebP/AVIF locais ou configure uma lista restrita de domínios em images.remotePatterns; next/image já inclui sizes e carregamento sob demanda.

Antes de publicar, substitua os seis produtos fictícios, preços e links example.com em src/data/mockProducts.ts e as ilustrações em public/images. Configure metadados de domínio e compartilhamento para o endereço real. Não há checkout, atualização de preços ou integração com programa de afiliados nesta base.
