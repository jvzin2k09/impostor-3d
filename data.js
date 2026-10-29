// Temas, palavras, nomes e cores dos bots
const $ = (s) => document.querySelector(s),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  pick = (a) => a[Math.floor(Math.random() * a.length)];
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
const DATA = `Frutas
banana|amarela,macaco,cacho,casca
uva|roxa,vinho,cacho,pequena
melancia|verão,listrada,sementes,grande
morango|vermelha,bolo,sementinhas,doce
abacaxi|coroa,tropical,espinhos,azedinho
Animais
cachorro|latido,fiel,osso,coleira
gato|miau,bigode,leite,sete vidas
elefante|tromba,gigante,marfim,orelhas
pinguim|gelo,frio,Antártida,smoking
girafa|pescoço,alta,manchas,savana
Profissões
médico|hospital,jaleco,receita,estetoscópio
bombeiro|fogo,sirene,mangueira,resgate
padeiro|pão,madrugada,forno,farinha
piloto|avião,cabine,nuvens,decolar
professor|aula,quadro,provas,giz
Lugares
praia|areia,sol,onda,guarda-sol
cinema|pipoca,tela,escuro,filme
biblioteca|silêncio,livros,estante,leitura
aeroporto|embarque,mala,pista,voo
circo|palhaço,lona,trapézio,mágico
Comidas
pizza|queijo,redonda,fatia,forno
sorvete|gelado,casquinha,verão,derrete
hambúrguer|pão,lanche,carne,fritas
chocolate|doce,cacau,barra,Páscoa
macarrão|massa,molho,garfo,italiano
Material escolar
caderno|folhas,espiral,anotar,capa
mochila|costas,zíper,peso,alças
apontador|lápis,ponta,lâmina,aparas
régua|reta,centímetros,medir,plástico
borracha|apagar,erro,esfregar,migalhas`;
const TH = {};
let _t;
DATA.split("\n").forEach((l) => {
  if (l.includes("|")) {
    const [w, c] = l.split("|");
    TH[_t].push({ w, c: c.split(",") });
  } else {
    _t = l;
    TH[_t] = [];
  }
});
const NAMES = ["Ana", "Bruno", "Carla", "Diego", "Eva", "Felipe", "Gabi"],
  COLS = [
    0xe76f51, 0x2a9d8f, 0xe9c46a, 0x8e6bbf, 0x4c9be8, 0xf28ab2, 0x6abf69,
    0xff9f1c,
  ];
