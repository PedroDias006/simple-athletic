/**
 * Teste do conector da Awin com um feed de exemplo (não acessa a internet).
 * Rode com: npx tsx bots/promocoes/testes/awin.teste.ts
 */
import assert from "node:assert/strict";
import { escolherDoTermo, juntarRepetidos, LOJAS, lerCsv, linhaParaProduto } from "../lojas/awin";

const feed = `aw_deep_link,product_name,aw_product_id,merchant_image_url,merchant_category,search_price,rrp_price,product_price_old,brand_name,colour,in_stock,ean,average_rating,reviews,Fashion:suitable_for
https://www.awin1.com/a?p=1,"Tênis Nike Revolution 7 Masculino Preto Tam 40",1,https://img/1.jpg,Calçados > Corrida,299.99,499.99,,Nike,Preto,1,789001,4.6,120,male
https://www.awin1.com/a?p=2,"Tênis Nike Revolution 7 Masculino Preto Tam 42",2,https://img/2.jpg,Calçados > Corrida,279.99,499.99,,Nike,Preto,1,789001,4.6,120,male
https://www.awin1.com/a?p=3,"Legging Feminina Dri-FIT One Tam M",3,https://img/3.jpg,Roupas > Fitness,149.90,,229.90,Nike,Rosa,1,789002,,,"female"
https://www.awin1.com/a?p=4,"Tênis Infantil Nike Star Runner",4,https://img/4.jpg,Infantil,199.99,299.99,,Nike,Azul,1,789003,,,unisex
https://www.awin1.com/a?p=5,"Camiseta Básica Algodão",5,https://img/5.jpg,Moda Feminina,59.90,,99.90,Basic,Branco,1,789004,,,female
https://www.awin1.com/a?p=6,"Bermuda de Treino Masculina",6,https://img/6.jpg,Roupas > Treino,89.90,,99.90,Nike,Preto,0,789005,,,male
https://www.awin1.com/a?p=7,"Tênis de Corrida Erro de Cadastro",7,https://img/7.jpg,Calçados > Corrida,10.00,999.00,,Nike,Preto,1,789006,,,male`;

const linhas = lerCsv(feed);
assert.equal(linhas.length, 7, "lê as 7 linhas");

// Loja certa pelo nome do anunciante na Awin
const loja = (nome: string) => LOJAS.find(([re]) => re.test(nome))?.[1];
assert.equal(loja("Nike BR"), "nike");
assert.equal(loja("adidas BR"), "adidas");
assert.equal(loja("Fut Fanatics BR"), "futfanatics");
assert.equal(loja("Lauri Esporte"), "lauri");
assert.equal(loja("PUMA BR"), "puma");
assert.equal(loja("Emma BR"), undefined, "loja que não é de esporte fica de fora");

const nike = linhas.map((l) => linhaParaProduto(l, "nike"));
assert.equal(nike[3], null, "infantil fica de fora");
assert.equal(nike[0]!.gender, "masculino", "gênero vem do feed");
assert.equal(nike[2]!.gender, "feminino");
assert.deepEqual(nike[0]!.colors, ["preto"], "cor vem do feed");
assert.equal(nike[0]!.rating, 4.6);
assert.equal(nike[0]!.oldPrice, 499.99, "preço 'de' vem do rrp_price quando não há product_price_old");
assert.equal(nike[5]!.inStock, false, "in_stock = 0 vira sem estoque");
assert.equal(nike[6]!.oldPrice, undefined, "desconto de 99% é tratado como erro de cadastro");

// Dafiti (moda geral): só entra o que é esporte
const dafiti = linhas.map((l) => linhaParaProduto(l, "dafiti"));
assert.equal(dafiti[4], null, "camiseta básica de moda não entra pela Dafiti");
assert.ok(dafiti[2], "legging de fitness entra pela Dafiti");

// Tamanhos 40 e 42 viram um produto só (o mais barato), e os dois ids apontam para ele
const reps = juntarRepetidos(nike.filter((p) => p !== null));
assert.equal(reps.get("awin-1"), reps.get("awin-2"), "tamanhos diferentes do mesmo tênis são um produto");
assert.equal(reps.get("awin-1")!.price, 279.99, "fica o tamanho mais barato");

// Mesmo EAN em duas lojas: fica a mais barata
const centauro = linhaParaProduto({ ...linhas[0], aw_product_id: "99", search_price: "259.90" }, "centauro")!;
const juntos = juntarRepetidos([nike[0]!, centauro]);
assert.equal(juntos.get("awin-1")!.store, "centauro", "mesmo produto em outra loja mais barato: fica a outra loja");

// Busca por termo
const unicos = [...new Set(reps.values())].filter((p) => p.inStock);
const achados = escolherDoTermo(unicos, "tênis corrida masculino", new Set());
assert.ok(achados.some((p) => p.id === "awin-2"), "acha o tênis de corrida masculino");
assert.ok(!achados.some((p) => p.id === "awin-3"), "não traz a legging feminina");

console.log("✔ conector da Awin: todos os testes passaram");
