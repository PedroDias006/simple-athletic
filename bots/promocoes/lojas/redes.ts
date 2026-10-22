import type { AdaptadorLoja, Verificacao } from "../tipos";

/**
 * Redes de afiliados que reúnem várias lojas (Netshoes, Centauro, Decathlon, Magalu...).
 * Estes adaptadores são esqueletos: ligam quando as chaves existem, mas ainda não buscam nada.
 * Depois de aprovado numa rede, implemente buscarOfertas lendo o feed de produtos oficial da loja
 * e use o prefixo do id ("awin-" / "lomadee-") para o bot saber quem recheca cada oferta.
 */

const naoImplementado: Verificacao = { status: "erro", motivo: "adaptador ainda não implementado" };

/** Awin — feeds de produtos (CSV) em ui.awin.com > Toolbox > Create-a-Feed. */
export const awin: AdaptadorLoja = {
  prefixo: "awin-",
  nome: "Awin",
  motivoDesligado() {
    return process.env.AWIN_API_TOKEN && process.env.AWIN_PUBLISHER_ID ? null : "defina AWIN_API_TOKEN e AWIN_PUBLISHER_ID";
  },
  async buscarOfertas() {
    // TODO: baixar o feed de cada loja aprovada (AWIN_FEED_IDS), filtrar search_price < rrp_price
    // e montar Oferta com aw_deep_link como affiliateUrl e store "netshoes" | "centauro" | "decathlon".
    return [];
  },
  async verificarOferta() {
    return naoImplementado;
  },
};

/** Lomadee — API de ofertas em lomadee.com (Ferramentas > API). */
export const lomadee: AdaptadorLoja = {
  prefixo: "lomadee-",
  nome: "Lomadee",
  motivoDesligado() {
    return process.env.LOMADEE_APP_TOKEN && process.env.LOMADEE_SOURCE_ID ? null : "defina LOMADEE_APP_TOKEN e LOMADEE_SOURCE_ID";
  },
  async buscarOfertas() {
    // TODO: chamar a API de ofertas da Lomadee por palavra-chave (termosDe(categoria)),
    // manter só lojas que existem em StoreId e usar o link já rastreado que a API devolve.
    return [];
  },
  async verificarOferta() {
    return naoImplementado;
  },
};
