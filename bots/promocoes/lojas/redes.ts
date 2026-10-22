import type { AdaptadorLoja, Verificacao } from "../tipos";

/**
 * Lomadee — outra rede de afiliados brasileira. Ainda é um esqueleto: liga com as chaves, mas não busca nada.
 * A Awin (Netshoes, Centauro, Decathlon) tem adaptador completo em ./awin.ts.
 */

const naoImplementado: Verificacao = { status: "erro", motivo: "adaptador ainda não implementado" };

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
