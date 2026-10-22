import type { NextConfig } from "next";

// CDNs de imagem das lojas. O bot salva imageUrl apontando para elas.
const imageHosts = [
  "http2.mlstatic.com",
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "down-br.img.susercontent.com",
  "cf.shopee.com.br",
  "static.netshoes.com.br",
  "imgcentauro-a.akamaihd.net",
  "contents.mediadecathlon.com",
  "a-static.mlcdn.com.br",
  // Fotos de campanha (hero e categorias), licença Unsplash.
  "images.unsplash.com",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
    // Na Cloudflare (plano grátis) as imagens vêm direto do CDN de cada loja, sem redimensionar no servidor.
    unoptimized: true,
  },
  async redirects() {
    return [{ source: "/tenis", destination: "/raquetes", permanent: true }];
  },
};

export default nextConfig;
