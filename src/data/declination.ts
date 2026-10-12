// Declinação de artigos e adjetivos — tabelas padrão (Duden, Grammatik der deutschen Sprache).
// Cada frase usa _BLANK_ no lugar da terminação; o radical (d-, ein-, kein-, adjetivo) fica visível.
// Frases do Tatoeba DE-PT (CC BY 2.0) — tatoeba.org — e frases escritas à mão quando não há correspondência.
// Cada entrada tem a terminação verificada contra a tabela por testes (tests/unit/declination.test.ts).

export type DeclinationTable =
  | 'artigo-definido'
  | 'artigo-indefinido'
  | 'adjetivo-forte'   // sem artigo
  | 'adjetivo-fraco'   // após artigo definido
  | 'adjetivo-misto'   // após ein-/kein-

export type Case = 'nom' | 'akk' | 'dat' | 'gen'
export type Gender = 'm' | 'f' | 'n'
export type Number = 'sg' | 'pl'

export interface DeclinationEntry {
  id: string
  table: DeclinationTable
  sentence: string   // com _BLANK_ no lugar da terminação
  ending: string     // terminação correta ('' quando a forma não tem terminação, ex.: ein Mann)
  case: Case
  gender: Gender     // gênero do substantivo (irrelevante na forma quando number === 'pl')
  number: Number
  translation: string
}

type EndingTable = Record<Case, Record<Gender | 'pl', string>>

export const ENDING_TABLES: Record<DeclinationTable, EndingTable> = {
  'artigo-definido': {
    nom: { m: 'er', f: 'ie', n: 'as', pl: 'ie' },
    akk: { m: 'en', f: 'ie', n: 'as', pl: 'ie' },
    dat: { m: 'em', f: 'er', n: 'em', pl: 'en' },
    gen: { m: 'es', f: 'er', n: 'es', pl: 'er' },
  },
  'artigo-indefinido': {
    nom: { m: '', f: 'e', n: '', pl: 'e' },
    akk: { m: 'en', f: 'e', n: '', pl: 'e' },
    dat: { m: 'em', f: 'er', n: 'em', pl: 'en' },
    gen: { m: 'es', f: 'er', n: 'es', pl: 'er' },
  },
  'adjetivo-forte': {
    nom: { m: 'er', f: 'e', n: 'es', pl: 'e' },
    akk: { m: 'en', f: 'e', n: 'es', pl: 'e' },
    dat: { m: 'em', f: 'er', n: 'em', pl: 'en' },
    gen: { m: 'en', f: 'er', n: 'en', pl: 'er' },
  },
  'adjetivo-fraco': {
    nom: { m: 'e', f: 'e', n: 'e', pl: 'en' },
    akk: { m: 'en', f: 'e', n: 'e', pl: 'en' },
    dat: { m: 'en', f: 'en', n: 'en', pl: 'en' },
    gen: { m: 'en', f: 'en', n: 'en', pl: 'en' },
  },
  'adjetivo-misto': {
    nom: { m: 'er', f: 'e', n: 'es', pl: 'en' },
    akk: { m: 'en', f: 'e', n: 'es', pl: 'en' },
    dat: { m: 'en', f: 'en', n: 'en', pl: 'en' },
    gen: { m: 'en', f: 'en', n: 'en', pl: 'en' },
  },
}

export const CASE_LABEL: Record<Case, string> = {
  nom: 'Nominativo',
  akk: 'Acusativo',
  dat: 'Dativo',
  gen: 'Genitivo',
}

export const GENDER_LABEL: Record<Gender, string> = {
  m: 'masculino',
  f: 'feminino',
  n: 'neutro',
}

export const TABLE_LABEL: Record<DeclinationTable, string> = {
  'artigo-definido':   'Artigo definido (der/die/das)',
  'artigo-indefinido': 'Artigo indefinido (ein/kein)',
  'adjetivo-forte':    'Adjetivo sem artigo (forte)',
  'adjetivo-fraco':    'Adjetivo após artigo definido (fraco)',
  'adjetivo-misto':    'Adjetivo após ein/kein (misto)',
}

export const DECLINATION_DATA: DeclinationEntry[] = [
  // ── Artigo definido ──────────────────────────────────────────────
  { id: 'dk_ad_01', table: 'artigo-definido', sentence: 'D_BLANK_ Mann wohnt hier.', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'O homem mora aqui.' },
  { id: 'dk_ad_02', table: 'artigo-definido', sentence: 'D_BLANK_ Frau arbeitet im Büro.', ending: 'ie', case: 'nom', gender: 'f', number: 'sg', translation: 'A mulher trabalha no escritório.' },
  { id: 'dk_ad_03', table: 'artigo-definido', sentence: 'D_BLANK_ Kind spielt im Garten.', ending: 'as', case: 'nom', gender: 'n', number: 'sg', translation: 'A criança brinca no jardim.' },
  { id: 'dk_ad_04', table: 'artigo-definido', sentence: 'D_BLANK_ Kinder spielen im Garten.', ending: 'ie', case: 'nom', gender: 'n', number: 'pl', translation: 'As crianças brincam no jardim.' },
  { id: 'dk_ad_05', table: 'artigo-definido', sentence: 'Ich sehe d_BLANK_ Mann am Bahnhof.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Vejo o homem na estação.' },
  { id: 'dk_ad_06', table: 'artigo-definido', sentence: 'Wir besuchen d_BLANK_ Tante am Wochenende.', ending: 'ie', case: 'akk', gender: 'f', number: 'sg', translation: 'Visitamos a tia no fim de semana.' },
  { id: 'dk_ad_07', table: 'artigo-definido', sentence: 'Er kauft d_BLANK_ Buch heute.', ending: 'as', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele compra o livro hoje.' },
  { id: 'dk_ad_08', table: 'artigo-definido', sentence: 'Ich lese d_BLANK_ Bücher im Urlaub.', ending: 'ie', case: 'akk', gender: 'n', number: 'pl', translation: 'Leio os livros nas férias.' },
  { id: 'dk_ad_09', table: 'artigo-definido', sentence: 'Ich helfe d_BLANK_ Lehrer bei der Arbeit.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Ajudo o professor no trabalho.' },
  { id: 'dk_ad_10', table: 'artigo-definido', sentence: 'Ich gebe d_BLANK_ Schwester ein Geschenk.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Dou um presente para a irmã.' },
  { id: 'dk_ad_11', table: 'artigo-definido', sentence: 'Wir antworten d_BLANK_ Kind freundlich.', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'Respondemos gentilmente à criança.' },
  { id: 'dk_ad_12', table: 'artigo-definido', sentence: 'Ich erzähle d_BLANK_ Kindern eine Geschichte.', ending: 'en', case: 'dat', gender: 'n', number: 'pl', translation: 'Conto uma história para as crianças.' },
  { id: 'dk_ad_13', table: 'artigo-definido', sentence: 'Wegen d_BLANK_ Regens bleiben wir zu Hause.', ending: 'es', case: 'gen', gender: 'm', number: 'sg', translation: 'Por causa da chuva, ficamos em casa.' },
  { id: 'dk_ad_14', table: 'artigo-definido', sentence: 'Trotz d_BLANK_ Kälte gehen wir spazieren.', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Apesar do frio, saímos para passear.' },
  { id: 'dk_ad_15', table: 'artigo-definido', sentence: 'Wegen d_BLANK_ Problems haben wir spät angefangen.', ending: 'es', case: 'gen', gender: 'n', number: 'sg', translation: 'Por causa do problema, começamos tarde.' },
  { id: 'dk_ad_16', table: 'artigo-definido', sentence: 'Während d_BLANK_ Ferien fahren wir nach Italien.', ending: 'er', case: 'gen', gender: 'f', number: 'pl', translation: 'Durante as férias, viajamos para a Itália.' },

  // ── Artigo indefinido (ein-/kein-) ───────────────────────────────
  { id: 'dk_ai_01', table: 'artigo-indefinido', sentence: 'Da steht ein_BLANK_ Mann an der Tür.', ending: '', case: 'nom', gender: 'm', number: 'sg', translation: 'Há um homem na porta.' },
  { id: 'dk_ai_02', table: 'artigo-indefinido', sentence: 'Hier wohnt ein_BLANK_ Katze.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Aqui mora um gato.' },
  { id: 'dk_ai_03', table: 'artigo-indefinido', sentence: 'Das ist ein_BLANK_ Problem.', ending: '', case: 'nom', gender: 'n', number: 'sg', translation: 'Isso é um problema.' },
  { id: 'dk_ai_04', table: 'artigo-indefinido', sentence: 'Hier sind kein_BLANK_ Kinder.', ending: 'e', case: 'nom', gender: 'n', number: 'pl', translation: 'Não há crianças aqui.' },
  { id: 'dk_ai_05', table: 'artigo-indefinido', sentence: 'Ich kaufe ein_BLANK_ Apfel.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Compro uma maçã.' },
  { id: 'dk_ai_06', table: 'artigo-indefinido', sentence: 'Sie hat ein_BLANK_ Idee.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Ela tem uma ideia.' },
  { id: 'dk_ai_07', table: 'artigo-indefinido', sentence: 'Wir brauchen ein_BLANK_ Auto.', ending: '', case: 'akk', gender: 'n', number: 'sg', translation: 'Precisamos de um carro.' },
  { id: 'dk_ai_08', table: 'artigo-indefinido', sentence: 'Er kauft kein_BLANK_ Bücher heute.', ending: 'e', case: 'akk', gender: 'n', number: 'pl', translation: 'Ele não compra livros hoje.' },
  { id: 'dk_ai_09', table: 'artigo-indefinido', sentence: 'Er wohnt mit ein_BLANK_ Freund zusammen.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Ele mora junto com um amigo.' },
  { id: 'dk_ai_10', table: 'artigo-indefinido', sentence: 'Er hilft ein_BLANK_ Freundin im Garten.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Ele ajuda uma amiga no jardim.' },
  { id: 'dk_ai_11', table: 'artigo-indefinido', sentence: 'Der Kaffee gehört zu ein_BLANK_ Frühstück.', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'O café faz parte de um café da manhã.' },
  { id: 'dk_ai_12', table: 'artigo-indefinido', sentence: 'Wir sprechen mit kein_BLANK_ Kindern.', ending: 'en', case: 'dat', gender: 'n', number: 'pl', translation: 'Não falamos com nenhuma criança.' },
  { id: 'dk_ai_13', table: 'artigo-indefinido', sentence: 'Wegen ein_BLANK_ Fehlers müssen wir neu anfangen.', ending: 'es', case: 'gen', gender: 'm', number: 'sg', translation: 'Por causa de um erro, precisamos recomeçar.' },
  { id: 'dk_ai_14', table: 'artigo-indefinido', sentence: 'Trotz ein_BLANK_ Verspätung kommen wir pünktlich an.', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Apesar de um atraso, chegamos no horário.' },
  { id: 'dk_ai_15', table: 'artigo-indefinido', sentence: 'Trotz ein_BLANK_ Angebots kaufen wir nichts.', ending: 'es', case: 'gen', gender: 'n', number: 'sg', translation: 'Apesar de uma oferta, não compramos nada.' },
  { id: 'dk_ai_16', table: 'artigo-indefinido', sentence: 'Wir verpassen den Zug nicht wegen kein_BLANK_ Verspätungen.', ending: 'er', case: 'gen', gender: 'f', number: 'pl', translation: 'Não perdemos o trem por causa de nenhum atraso.' },

  // ── Adjetivo sem artigo (declinação forte) ───────────────────────
  { id: 'dk_af_01', table: 'adjetivo-forte', sentence: 'Frisch_BLANK_ Kaffee schmeckt gut.', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'Café fresco tem bom sabor.' },
  { id: 'dk_af_02', table: 'adjetivo-forte', sentence: 'Gut_BLANK_ Milch ist gesund.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Leite bom é saudável.' },
  { id: 'dk_af_03', table: 'adjetivo-forte', sentence: 'Warm_BLANK_ Wasser tut gut.', ending: 'es', case: 'nom', gender: 'n', number: 'sg', translation: 'Água morna faz bem.' },
  { id: 'dk_af_04', table: 'adjetivo-forte', sentence: 'Neu_BLANK_ Bücher liegen auf dem Tisch.', ending: 'e', case: 'nom', gender: 'n', number: 'pl', translation: 'Livros novos estão sobre a mesa.' },
  { id: 'dk_af_05', table: 'adjetivo-forte', sentence: 'Ich trinke stark_BLANK_ Kaffee am Morgen.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Bebo café forte de manhã.' },
  { id: 'dk_af_06', table: 'adjetivo-forte', sentence: 'Ich möchte frisch_BLANK_ Milch.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Quero leite fresco.' },
  { id: 'dk_af_07', table: 'adjetivo-forte', sentence: 'Er bestellt warm_BLANK_ Essen.', ending: 'es', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele pede comida quente.' },
  { id: 'dk_af_08', table: 'adjetivo-forte', sentence: 'Wir essen gern frisch_BLANK_ Tomaten.', ending: 'e', case: 'akk', gender: 'f', number: 'pl', translation: 'Gostamos de comer tomates frescos.' },
  { id: 'dk_af_09', table: 'adjetivo-forte', sentence: 'Sie fährt mit schnell_BLANK_ Zug.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Ela viaja de trem rápido.' },
  { id: 'dk_af_10', table: 'adjetivo-forte', sentence: 'Ich schreibe mit schwarz_BLANK_ Tinte.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Escrevo com tinta preta.' },
  { id: 'dk_af_11', table: 'adjetivo-forte', sentence: 'Mit frisch_BLANK_ Brot schmeckt das Frühstück besser.', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'Com pão fresco, o café da manhã fica melhor.' },
  { id: 'dk_af_12', table: 'adjetivo-forte', sentence: 'Ich esse gern Suppe mit frisch_BLANK_ Kräutern.', ending: 'en', case: 'dat', gender: 'm', number: 'pl', translation: 'Gosto de sopa com ervas frescas.' },
  { id: 'dk_af_13', table: 'adjetivo-forte', sentence: 'Wegen gut_BLANK_ Wetters gehen wir raus.', ending: 'en', case: 'gen', gender: 'n', number: 'sg', translation: 'Por causa do bom tempo, saímos.' },
  { id: 'dk_af_14', table: 'adjetivo-forte', sentence: 'Trotz kalt_BLANK_ Winters fahren wir ans Meer.', ending: 'en', case: 'gen', gender: 'm', number: 'sg', translation: 'Apesar do inverno frio, vamos ao mar.' },
  { id: 'dk_af_15', table: 'adjetivo-forte', sentence: 'Wegen schwer_BLANK_ Krankheit bleibt sie zu Hause.', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Por causa de uma doença grave, ela fica em casa.' },
  { id: 'dk_af_16', table: 'adjetivo-forte', sentence: 'Trotz gut_BLANK_ Ideen ist das Projekt gescheitert.', ending: 'er', case: 'gen', gender: 'f', number: 'pl', translation: 'Apesar de boas ideias, o projeto fracassou.' },

  // ── Adjetivo após artigo definido (declinação fraca) ─────────────
  { id: 'dk_aw_01', table: 'adjetivo-fraco', sentence: 'Der alt_BLANK_ Mann wohnt hier.', ending: 'e', case: 'nom', gender: 'm', number: 'sg', translation: 'O homem velho mora aqui.' },
  { id: 'dk_aw_02', table: 'adjetivo-fraco', sentence: 'Die neu_BLANK_ Wohnung ist hell.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'O apartamento novo é claro.' },
  { id: 'dk_aw_03', table: 'adjetivo-fraco', sentence: 'Das klein_BLANK_ Haus ist gemütlich.', ending: 'e', case: 'nom', gender: 'n', number: 'sg', translation: 'A casinha é aconchegante.' },
  { id: 'dk_aw_04', table: 'adjetivo-fraco', sentence: 'Die jung_BLANK_ Leute tanzen.', ending: 'en', case: 'nom', gender: 'm', number: 'pl', translation: 'As pessoas jovens dançam.' },
  { id: 'dk_aw_05', table: 'adjetivo-fraco', sentence: 'Ich sehe den alt_BLANK_ Mann.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Vejo o homem velho.' },
  { id: 'dk_aw_06', table: 'adjetivo-fraco', sentence: 'Wir kaufen die frisch_BLANK_ Milch.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Compramos o leite fresco.' },
  { id: 'dk_aw_07', table: 'adjetivo-fraco', sentence: 'Er liest das gut_BLANK_ Buch.', ending: 'e', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele lê o bom livro.' },
  { id: 'dk_aw_08', table: 'adjetivo-fraco', sentence: 'Ich lese die interessant_BLANK_ Bücher.', ending: 'en', case: 'akk', gender: 'n', number: 'pl', translation: 'Leio os livros interessantes.' },
  { id: 'dk_aw_09', table: 'adjetivo-fraco', sentence: 'Ich helfe dem freundlich_BLANK_ Lehrer.', ending: 'en', case: 'dat', gender: 'm', number: 'sg', translation: 'Ajudo o professor simpático.' },
  { id: 'dk_aw_10', table: 'adjetivo-fraco', sentence: 'Ich danke der nett_BLANK_ Verkäuferin.', ending: 'en', case: 'dat', gender: 'f', number: 'sg', translation: 'Agradeço à vendedora simpática.' },
  { id: 'dk_aw_11', table: 'adjetivo-fraco', sentence: 'Wir wohnen in dem neu_BLANK_ Haus.', ending: 'en', case: 'dat', gender: 'n', number: 'sg', translation: 'Moramos na casa nova.' },
  { id: 'dk_aw_12', table: 'adjetivo-fraco', sentence: 'Ich antworte den klug_BLANK_ Kindern.', ending: 'en', case: 'dat', gender: 'n', number: 'pl', translation: 'Respondo às crianças inteligentes.' },
  { id: 'dk_aw_13', table: 'adjetivo-fraco', sentence: 'Wegen des schön_BLANK_ Wetters gehen wir raus.', ending: 'en', case: 'gen', gender: 'n', number: 'sg', translation: 'Por causa do bom tempo, saímos.' },
  { id: 'dk_aw_14', table: 'adjetivo-fraco', sentence: 'Trotz des kalt_BLANK_ Winters fahren wir ans Meer.', ending: 'en', case: 'gen', gender: 'm', number: 'sg', translation: 'Apesar do inverno frio, vamos ao mar.' },
  { id: 'dk_aw_15', table: 'adjetivo-fraco', sentence: 'Wegen der lang_BLANK_ Reise sind wir müde.', ending: 'en', case: 'gen', gender: 'f', number: 'sg', translation: 'Por causa da longa viagem, estamos cansados.' },
  { id: 'dk_aw_16', table: 'adjetivo-fraco', sentence: 'Trotz der gut_BLANK_ Ideen ist das Projekt gescheitert.', ending: 'en', case: 'gen', gender: 'f', number: 'pl', translation: 'Apesar das boas ideias, o projeto fracassou.' },

  // ── Adjetivo após ein-/kein- (declinação mista) ──────────────────
  { id: 'dk_am_01', table: 'adjetivo-misto', sentence: 'Ein gut_BLANK_ Freund hilft mir.', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'Um bom amigo me ajuda.' },
  { id: 'dk_am_02', table: 'adjetivo-misto', sentence: 'Eine nett_BLANK_ Lehrerin erklärt das.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Uma professora simpática explica isso.' },
  { id: 'dk_am_03', table: 'adjetivo-misto', sentence: 'Ein schön_BLANK_ Bild hängt an der Wand.', ending: 'es', case: 'nom', gender: 'n', number: 'sg', translation: 'Uma bela imagem está pendurada na parede.' },
  { id: 'dk_am_04', table: 'adjetivo-misto', sentence: 'Keine gut_BLANK_ Ideen sind hier.', ending: 'en', case: 'nom', gender: 'f', number: 'pl', translation: 'Nenhuma boa ideia está aqui.' },
  { id: 'dk_am_05', table: 'adjetivo-misto', sentence: 'Er kauft einen neu_BLANK_ Computer.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Ele compra um computador novo.' },
  { id: 'dk_am_06', table: 'adjetivo-misto', sentence: 'Sie hat eine ruhig_BLANK_ Wohnung gefunden.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Ela encontrou um apartamento tranquilo.' },
  { id: 'dk_am_07', table: 'adjetivo-misto', sentence: 'Wir kaufen ein groß_BLANK_ Haus.', ending: 'es', case: 'akk', gender: 'n', number: 'sg', translation: 'Compramos uma casa grande.' },
  { id: 'dk_am_08', table: 'adjetivo-misto', sentence: 'Ich habe keine alt_BLANK_ Bücher.', ending: 'en', case: 'akk', gender: 'n', number: 'pl', translation: 'Não tenho livros antigos.' },
  { id: 'dk_am_09', table: 'adjetivo-misto', sentence: 'Ich gebe einem jung_BLANK_ Mann die Tasche.', ending: 'en', case: 'dat', gender: 'm', number: 'sg', translation: 'Dou a bolsa a um homem jovem.' },
  { id: 'dk_am_10', table: 'adjetivo-misto', sentence: 'Ich schenke einer lieb_BLANK_ Freundin Blumen.', ending: 'en', case: 'dat', gender: 'f', number: 'sg', translation: 'Dou flores a uma amiga querida.' },
  { id: 'dk_am_11', table: 'adjetivo-misto', sentence: 'Er wohnt in einem klein_BLANK_ Dorf.', ending: 'en', case: 'dat', gender: 'n', number: 'sg', translation: 'Ele mora numa pequena aldeia.' },
  { id: 'dk_am_12', table: 'adjetivo-misto', sentence: 'Ich arbeite mit keinen unfreundlich_BLANK_ Kollegen.', ending: 'en', case: 'dat', gender: 'm', number: 'pl', translation: 'Não trabalho com colegas antipáticos.' },
  { id: 'dk_am_13', table: 'adjetivo-misto', sentence: 'Wegen eines klein_BLANK_ Fehlers ist das Ergebnis falsch.', ending: 'en', case: 'gen', gender: 'm', number: 'sg', translation: 'Por causa de um pequeno erro, o resultado está errado.' },
  { id: 'dk_am_14', table: 'adjetivo-misto', sentence: 'Trotz einer lang_BLANK_ Pause arbeiten wir weiter.', ending: 'en', case: 'gen', gender: 'f', number: 'sg', translation: 'Apesar de uma pausa longa, continuamos trabalhando.' },
  { id: 'dk_am_15', table: 'adjetivo-misto', sentence: 'Wegen eines schlecht_BLANK_ Wetters bleiben wir zu Hause.', ending: 'en', case: 'gen', gender: 'n', number: 'sg', translation: 'Por causa do mau tempo, ficamos em casa.' },
  { id: 'dk_am_16', table: 'adjetivo-misto', sentence: 'Wir sind trotz keiner gut_BLANK_ Noten zufrieden.', ending: 'en', case: 'gen', gender: 'f', number: 'pl', translation: 'Estamos satisfeitos, apesar de nenhuma boa nota.' },

  // ── artigo-definido (Tatoeba) ──
  { id: 'dk_ad_t01', table: 'artigo-definido', sentence: 'D_BLANK_ Bus war voll.', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'O ônibus estava cheio.' },
  { id: 'dk_ad_t02', table: 'artigo-definido', sentence: 'D_BLANK_ Himmel ist blau.', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'O céu é azul.' },
  { id: 'dk_ad_t03', table: 'artigo-definido', sentence: 'D_BLANK_ Erde ist rund.', ending: 'ie', case: 'nom', gender: 'f', number: 'sg', translation: 'A Terra é redonda.' },
  { id: 'dk_ad_t04', table: 'artigo-definido', sentence: 'D_BLANK_ Welt ist klein.', ending: 'ie', case: 'nom', gender: 'f', number: 'sg', translation: 'O mundo é pequeno.' },
  { id: 'dk_ad_t05', table: 'artigo-definido', sentence: 'D_BLANK_ Schiff sinkt.', ending: 'as', case: 'nom', gender: 'n', number: 'sg', translation: 'O navio está afundando.' },
  { id: 'dk_ad_t06', table: 'artigo-definido', sentence: 'D_BLANK_ Bäume sind grün.', ending: 'ie', case: 'nom', gender: 'm', number: 'pl', translation: 'As árvores estão verdes.' },
  { id: 'dk_ad_t07', table: 'artigo-definido', sentence: 'D_BLANK_ Blumen blühen.', ending: 'ie', case: 'nom', gender: 'f', number: 'pl', translation: 'As flores estão florescendo.' },
  { id: 'dk_ad_t08', table: 'artigo-definido', sentence: 'Ich mag d_BLANK_ Hund.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Eu gosto do cachorro.' },
  { id: 'dk_ad_t09', table: 'artigo-definido', sentence: 'Ich liebe d_BLANK_ Natur.', ending: 'ie', case: 'akk', gender: 'f', number: 'sg', translation: 'Adoro a natureza.' },
  { id: 'dk_ad_t10', table: 'artigo-definido', sentence: 'Ich kenne d_BLANK_ Wahrheit.', ending: 'ie', case: 'akk', gender: 'f', number: 'sg', translation: 'Eu conheço a verdade.' },
  { id: 'dk_ad_t11', table: 'artigo-definido', sentence: 'Ich kenne d_BLANK_ Mädchen.', ending: 'as', case: 'akk', gender: 'n', number: 'sg', translation: 'Eu conheço a menina.' },
  { id: 'dk_ad_t12', table: 'artigo-definido', sentence: 'Wir brauchen d_BLANK_ Geld.', ending: 'as', case: 'akk', gender: 'n', number: 'sg', translation: 'Precisamos do dinheiro.' },
  { id: 'dk_ad_t13', table: 'artigo-definido', sentence: 'Hörst du d_BLANK_ Vögel singen?', ending: 'ie', case: 'akk', gender: 'm', number: 'pl', translation: 'Você ouve os pássaros cantando?' },
  { id: 'dk_ad_t14', table: 'artigo-definido', sentence: 'Ich wasche d_BLANK_ Teller nach dem Essen.', ending: 'ie', case: 'akk', gender: 'm', number: 'pl', translation: 'Eu lavo os pratos depois da refeição.' },
  { id: 'dk_ad_t15', table: 'artigo-definido', sentence: 'Ich bin auf d_BLANK_ Balkon.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Estou na varanda.' },
  { id: 'dk_ad_t16', table: 'artigo-definido', sentence: 'Er lag auf d_BLANK_ Rasen.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Ele estava deitado na grama.' },
  { id: 'dk_ad_t17', table: 'artigo-definido', sentence: 'Ich lebe in d_BLANK_ Stadt.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Moro na cidade.' },
  { id: 'dk_ad_t18', table: 'artigo-definido', sentence: 'Er klopfte an d_BLANK_ Tür.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Ele bateu na porta.' },
  { id: 'dk_ad_t19', table: 'artigo-definido', sentence: 'Er ging aus d_BLANK_ Zimmer.', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'Ele saiu do quarto.' },
  { id: 'dk_ad_t20', table: 'artigo-definido', sentence: 'Er sprang aus d_BLANK_ Bett.', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'Ele pulou da cama.' },
  { id: 'dk_ad_t21', table: 'artigo-definido', sentence: 'Ich war in d_BLANK_ Bergen.', ending: 'en', case: 'dat', gender: 'm', number: 'pl', translation: 'Eu estava nas montanhas.' },
  { id: 'dk_ad_t22', table: 'artigo-definido', sentence: 'Zu d_BLANK_ Waffen!', ending: 'en', case: 'dat', gender: 'f', number: 'pl', translation: 'Às armas!' },
  { id: 'dk_ad_t23', table: 'artigo-definido', sentence: 'Trotz d_BLANK_ Regens kamen sie.', ending: 'es', case: 'gen', gender: 'm', number: 'sg', translation: 'Apesar da chuva, eles vieram.' },
  { id: 'dk_ad_t24', table: 'artigo-definido', sentence: 'Ich bin wegen d_BLANK_ Regens zu spät.', ending: 'es', case: 'gen', gender: 'm', number: 'sg', translation: 'Cheguei atrasado por causa da chuva.' },
  { id: 'dk_ad_t25', table: 'artigo-definido', sentence: 'Er lebt außerhalb d_BLANK_ Stadt.', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Ele mora fora da cidade.' },
  { id: 'dk_ad_t26', table: 'artigo-definido', sentence: 'Ich bin müde wegen d_BLANK_ Hitze.', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Estou cansado por causa do calor.' },
  { id: 'dk_ad_t27', table: 'artigo-definido', sentence: 'Er tat es wegen d_BLANK_ Geldes.', ending: 'es', case: 'gen', gender: 'n', number: 'sg', translation: 'Ele fez isso por causa do dinheiro.' },
  { id: 'dk_ad_t28', table: 'artigo-definido', sentence: 'Sei still während d_BLANK_ Kurses.', ending: 'es', case: 'gen', gender: 'n', number: 'sg', translation: 'Fique quieto durante o curso.' },
  { id: 'dk_ad_t29', table: 'artigo-definido', sentence: 'Während d_BLANK_ Ferien habe ich ein Auto gemietet.', ending: 'er', case: 'gen', gender: 'f', number: 'pl', translation: 'Durante as férias aluguei um carro.' },
  // ── artigo-indefinido (Tatoeba) ──
  { id: 'dk_ai_t01', table: 'artigo-indefinido', sentence: 'Ein_BLANK_ Löwe ist stark.', ending: '', case: 'nom', gender: 'm', number: 'sg', translation: 'Um leão é forte.' },
  { id: 'dk_ai_t02', table: 'artigo-indefinido', sentence: 'Ein_BLANK_ Mann kam näher.', ending: '', case: 'nom', gender: 'm', number: 'sg', translation: 'Um homem se aproximou.' },
  { id: 'dk_ai_t03', table: 'artigo-indefinido', sentence: 'Ein_BLANK_ Frau liest.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Uma mulher está lendo.' },
  { id: 'dk_ai_t04', table: 'artigo-indefinido', sentence: 'Ein_BLANK_ Seite fehlt.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Falta uma página.' },
  { id: 'dk_ai_t05', table: 'artigo-indefinido', sentence: 'Ein_BLANK_ Glas Wasser, bitte!', ending: '', case: 'nom', gender: 'n', number: 'sg', translation: 'Um copo de água, por favor.' },
  { id: 'dk_ai_t06', table: 'artigo-indefinido', sentence: 'Ein_BLANK_ Klavier ist teuer.', ending: '', case: 'nom', gender: 'n', number: 'sg', translation: 'Um piano é caro.' },
  { id: 'dk_ai_t07', table: 'artigo-indefinido', sentence: 'Kein_BLANK_ Kekse mehr!', ending: 'e', case: 'nom', gender: 'm', number: 'pl', translation: 'Chega de biscoitos!' },
  { id: 'dk_ai_t08', table: 'artigo-indefinido', sentence: 'Kein_BLANK_ Partys mehr.', ending: 'e', case: 'nom', gender: 'f', number: 'pl', translation: 'Chega de festas.' },
  { id: 'dk_ai_t09', table: 'artigo-indefinido', sentence: 'Er hat ein_BLANK_ Hund.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Ele tem um cachorro.' },
  { id: 'dk_ai_t10', table: 'artigo-indefinido', sentence: 'Er isst ein_BLANK_ Apfel.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Ele está comendo uma maçã.' },
  { id: 'dk_ai_t11', table: 'artigo-indefinido', sentence: 'Ich habe ein_BLANK_ Idee.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Tenho uma ideia.' },
  { id: 'dk_ai_t12', table: 'artigo-indefinido', sentence: 'Wir kaufen ein_BLANK_ CD.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Compramos um CD.' },
  { id: 'dk_ai_t13', table: 'artigo-indefinido', sentence: 'Er hat ein_BLANK_ Auto.', ending: '', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele tem um carro.' },
  { id: 'dk_ai_t14', table: 'artigo-indefinido', sentence: 'Ich sehe ein_BLANK_ Buch.', ending: '', case: 'akk', gender: 'n', number: 'sg', translation: 'Vejo um livro.' },
  { id: 'dk_ai_t15', table: 'artigo-indefinido', sentence: 'Er hat kein_BLANK_ Kinder.', ending: 'e', case: 'akk', gender: 'n', number: 'pl', translation: 'Ele não tem filhos.' },
  { id: 'dk_ai_t16', table: 'artigo-indefinido', sentence: 'Ich mag kein_BLANK_ Äpfel.', ending: 'e', case: 'akk', gender: 'm', number: 'pl', translation: 'Não gosto de maçãs.' },
  { id: 'dk_ai_t17', table: 'artigo-indefinido', sentence: 'Ich arbeite mit ein_BLANK_ Spanier.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Trabalho com um espanhol.' },
  { id: 'dk_ai_t18', table: 'artigo-indefinido', sentence: 'Er erblindete bei ein_BLANK_ Unfall.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Ele ficou cego num acidente.' },
  { id: 'dk_ai_t19', table: 'artigo-indefinido', sentence: 'Ich kenne ihn seit ein_BLANK_ Jahr.', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'Eu o conheço há um ano.' },
  { id: 'dk_ai_t20', table: 'artigo-indefinido', sentence: 'Wie wäre es mit ein_BLANK_ Glas Bier?', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'Que tal um copo de cerveja?' },
  { id: 'dk_ai_t21', table: 'artigo-indefinido', sentence: 'Er arbeitet bei ein_BLANK_ Bank.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Ele trabalha num banco.' },
  { id: 'dk_ai_t22', table: 'artigo-indefinido', sentence: 'Ich suchte nach ein_BLANK_ Arbeit.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Eu procurava um emprego.' },
  { id: 'dk_ai_t23', table: 'artigo-indefinido', sentence: 'Innerhalb ein_BLANK_ Monats heiratete mein Bruder.', ending: 'es', case: 'gen', gender: 'm', number: 'sg', translation: 'Em menos de um mês, meu irmão se casou.' },
  { id: 'dk_ai_t24', table: 'artigo-indefinido', sentence: 'Ich bin wegen ein_BLANK_ Unfalls zu spät gekommen.', ending: 'es', case: 'gen', gender: 'm', number: 'sg', translation: 'Cheguei atrasado por causa de um acidente.' },
  { id: 'dk_ai_t25', table: 'artigo-indefinido', sentence: 'Er wird innerhalb ein_BLANK_ Stunde ankommen.', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Ele chegará antes de uma hora.' },
  { id: 'dk_ai_t26', table: 'artigo-indefinido', sentence: 'Hast du jemals wegen ein_BLANK_ Frau geweint?', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Você já chorou por causa de uma mulher?' },
  { id: 'dk_ai_t27', table: 'artigo-indefinido', sentence: 'Er schenkte mir ein Buch anstatt ein_BLANK_ Messers.', ending: 'es', case: 'gen', gender: 'n', number: 'sg', translation: 'Ele me deu um livro em vez de uma faca.' },
  { id: 'dk_ai_t28', table: 'artigo-indefinido', sentence: 'Die zwei Alten starben innerhalb ein_BLANK_ Jahres.', ending: 'es', case: 'gen', gender: 'n', number: 'sg', translation: 'Os dois velhos morreram em menos de um ano.' },
  // ── adjetivo-forte (Tatoeba) ──
  { id: 'dk_af_t01', table: 'adjetivo-forte', sentence: 'Schön_BLANK_ Tag, oder?', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'Dia bonito, não é?' },
  { id: 'dk_af_t02', table: 'adjetivo-forte', sentence: 'Schön_BLANK_ Wetter, oder?', ending: 'es', case: 'nom', gender: 'n', number: 'sg', translation: 'Tempo bonito, não é?' },
  { id: 'dk_af_t03', table: 'adjetivo-forte', sentence: 'Kalt_BLANK_ Milch schmeckt gut.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Leite gelado tem bom sabor.' },
  { id: 'dk_af_t04', table: 'adjetivo-forte', sentence: 'Frisch_BLANK_ Brötchen gibt es hier.', ending: 'e', case: 'nom', gender: 'm', number: 'pl', translation: 'Aqui há pãezinhos frescos.' },
  { id: 'dk_af_t05', table: 'adjetivo-forte', sentence: 'Ich brauche frisch_BLANK_ Kaffee.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Preciso de café fresco.' },
  { id: 'dk_af_t06', table: 'adjetivo-forte', sentence: 'Ich trinke gerne kalt_BLANK_ Milch.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Gosto de beber leite gelado.' },
  { id: 'dk_af_t07', table: 'adjetivo-forte', sentence: 'Er isst gern warm_BLANK_ Brot.', ending: 'es', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele gosta de comer pão quente.' },
  { id: 'dk_af_t08', table: 'adjetivo-forte', sentence: 'Er kauft gern gebraucht_BLANK_ Bücher.', ending: 'e', case: 'akk', gender: 'n', number: 'pl', translation: 'Ele gosta de comprar livros usados.' },
  { id: 'dk_af_t09', table: 'adjetivo-forte', sentence: 'Mit gut_BLANK_ Willen geht es.', ending: 'em', case: 'dat', gender: 'm', number: 'sg', translation: 'Com boa vontade, dá certo.' },
  { id: 'dk_af_t10', table: 'adjetivo-forte', sentence: 'Wir gehen an frisch_BLANK_ Luft spazieren.', ending: 'er', case: 'dat', gender: 'f', number: 'sg', translation: 'Vamos passear ao ar fresco.' },
  { id: 'dk_af_t11', table: 'adjetivo-forte', sentence: 'Er kocht mit frisch_BLANK_ Gemüse.', ending: 'em', case: 'dat', gender: 'n', number: 'sg', translation: 'Ele cozinha com legumes frescos.' },
  { id: 'dk_af_t12', table: 'adjetivo-forte', sentence: 'Ich verbringe Zeit mit gut_BLANK_ Freunden.', ending: 'en', case: 'dat', gender: 'm', number: 'pl', translation: 'Passo tempo com bons amigos.' },
  { id: 'dk_af_t13', table: 'adjetivo-forte', sentence: 'Der Flug wurde wegen dick_BLANK_ Nebels abgesagt.', ending: 'en', case: 'gen', gender: 'm', number: 'sg', translation: 'O voo foi cancelado por causa de névoa densa.' },
  { id: 'dk_af_t14', table: 'adjetivo-forte', sentence: 'Wegen schlecht_BLANK_ Laune bleibe ich zu Hause.', ending: 'er', case: 'gen', gender: 'f', number: 'sg', translation: 'Por causa do mau humor, fico em casa.' },
  { id: 'dk_af_t15', table: 'adjetivo-forte', sentence: 'Trotz schlecht_BLANK_ Wetters gehen wir spazieren.', ending: 'en', case: 'gen', gender: 'n', number: 'sg', translation: 'Apesar do mau tempo, saímos para passear.' },
  { id: 'dk_af_t16', table: 'adjetivo-forte', sentence: 'Wegen neu_BLANK_ Regeln ändert sich alles.', ending: 'er', case: 'gen', gender: 'f', number: 'pl', translation: 'Por causa de novas regras, tudo muda.' },
  // ── adjetivo-fraco (Tatoeba) ──
  { id: 'dk_aw_t01', table: 'adjetivo-fraco', sentence: 'Der jung_BLANK_ Mann ist Arzt.', ending: 'e', case: 'nom', gender: 'm', number: 'sg', translation: 'O homem jovem é médico.' },
  { id: 'dk_aw_t02', table: 'adjetivo-fraco', sentence: 'Der alt_BLANK_ Mann fiel hin.', ending: 'e', case: 'nom', gender: 'm', number: 'sg', translation: 'O velho caiu.' },
  { id: 'dk_aw_t03', table: 'adjetivo-fraco', sentence: 'Die neu_BLANK_ Brücke ist im Bau.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'A ponte nova está em construção.' },
  { id: 'dk_aw_t04', table: 'adjetivo-fraco', sentence: 'Die ganz_BLANK_ Welt schaut zu.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'O mundo inteiro está olhando.' },
  { id: 'dk_aw_t05', table: 'adjetivo-fraco', sentence: 'Das rot_BLANK_ Haus ist neu.', ending: 'e', case: 'nom', gender: 'n', number: 'sg', translation: 'A casa vermelha é nova.' },
  { id: 'dk_aw_t06', table: 'adjetivo-fraco', sentence: 'Das weiß_BLANK_ Haus ist alt.', ending: 'e', case: 'nom', gender: 'n', number: 'sg', translation: 'A casa branca é velha.' },
  { id: 'dk_aw_t07', table: 'adjetivo-fraco', sentence: 'Die ander_BLANK_ Kinder lachten.', ending: 'en', case: 'nom', gender: 'm', number: 'pl', translation: 'As outras crianças riram.' },
  { id: 'dk_aw_t08', table: 'adjetivo-fraco', sentence: 'Die wahr_BLANK_ Helden sind wir.', ending: 'en', case: 'nom', gender: 'm', number: 'pl', translation: 'Os verdadeiros heróis somos nós.' },
  { id: 'dk_aw_t09', table: 'adjetivo-fraco', sentence: 'Er liest den ganz_BLANK_ Tag.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Ele lê o dia inteiro.' },
  { id: 'dk_aw_t10', table: 'adjetivo-fraco', sentence: 'Ich nehme den nächst_BLANK_ Bus.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Vou pegar o próximo ônibus.' },
  { id: 'dk_aw_t11', table: 'adjetivo-fraco', sentence: 'Ich mag die grün_BLANK_ Farbe.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Gosto da cor verde.' },
  { id: 'dk_aw_t12', table: 'adjetivo-fraco', sentence: 'Ich mag die frisch_BLANK_ Luft.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Gosto do ar fresco.' },
  { id: 'dk_aw_t13', table: 'adjetivo-fraco', sentence: 'Er liebt das neu_BLANK_ Haus.', ending: 'e', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele adora a casa nova.' },
  { id: 'dk_aw_t14', table: 'adjetivo-fraco', sentence: 'Siehst du das groß_BLANK_ Buch?', ending: 'e', case: 'akk', gender: 'n', number: 'sg', translation: 'Você vê o livro grande?' },
  { id: 'dk_aw_t15', table: 'adjetivo-fraco', sentence: 'Danke für die warm_BLANK_ Worte.', ending: 'en', case: 'akk', gender: 'f', number: 'pl', translation: 'Obrigado pelas palavras calorosas.' },
  { id: 'dk_aw_t16', table: 'adjetivo-fraco', sentence: 'Wir haben die best_BLANK_ Ideen.', ending: 'en', case: 'akk', gender: 'f', number: 'pl', translation: 'Temos as melhores ideias.' },
  { id: 'dk_aw_t17', table: 'adjetivo-fraco', sentence: 'Tom fuhr mit dem gleich_BLANK_ Zug.', ending: 'en', case: 'dat', gender: 'm', number: 'sg', translation: 'Tom viajou no mesmo trem.' },
  { id: 'dk_aw_t18', table: 'adjetivo-fraco', sentence: 'Tom ist von der alt_BLANK_ Schule.', ending: 'en', case: 'dat', gender: 'f', number: 'sg', translation: 'Tom é da escola antiga.' },
  { id: 'dk_aw_t19', table: 'adjetivo-fraco', sentence: 'Schreib mit der recht_BLANK_ Hand.', ending: 'en', case: 'dat', gender: 'f', number: 'sg', translation: 'Escreve com a mão direita.' },
  { id: 'dk_aw_t20', table: 'adjetivo-fraco', sentence: 'Runter mit dem nass_BLANK_ Zeug!', ending: 'en', case: 'dat', gender: 'n', number: 'sg', translation: 'Tira essa coisa molhada!' },
  { id: 'dk_aw_t21', table: 'adjetivo-fraco', sentence: 'Ich helfe den alt_BLANK_ Leuten.', ending: 'en', case: 'dat', gender: 'm', number: 'pl', translation: 'Eu ajudo as pessoas idosas.' },
  { id: 'dk_aw_t22', table: 'adjetivo-fraco', sentence: 'Er kam trotz des schwer_BLANK_ Schneefalls.', ending: 'en', case: 'gen', gender: 'm', number: 'sg', translation: 'Ele veio apesar da forte nevasca.' },
  { id: 'dk_aw_t23', table: 'adjetivo-fraco', sentence: 'Ich erschrak wegen des laut_BLANK_ Geräusches.', ending: 'en', case: 'gen', gender: 'n', number: 'sg', translation: 'Assustei-me por causa do barulho alto.' },
  { id: 'dk_aw_t24', table: 'adjetivo-fraco', sentence: 'Tom ist wegen der kommend_BLANK_ Prüfung unruhig.', ending: 'en', case: 'gen', gender: 'f', number: 'sg', translation: 'Tom está nervoso por causa da prova que se aproxima.' },
  { id: 'dk_aw_t25', table: 'adjetivo-fraco', sentence: 'Sie fiel wegen der schlecht_BLANK_ Luft in Ohnmacht.', ending: 'en', case: 'gen', gender: 'f', number: 'sg', translation: 'Ela desmaiou por causa do ar ruim.' },
  { id: 'dk_aw_t26', table: 'adjetivo-fraco', sentence: 'Er kam trotz des schlecht_BLANK_ Wetters.', ending: 'en', case: 'gen', gender: 'n', number: 'sg', translation: 'Ele veio apesar do mau tempo.' },
  { id: 'dk_aw_t27', table: 'adjetivo-fraco', sentence: 'Es sah den Wald nicht wegen der viel_BLANK_ Bäume.', ending: 'en', case: 'gen', gender: 'm', number: 'pl', translation: 'Não via a floresta por causa das muitas árvores.' },
  // ── adjetivo-misto (Tatoeba) ──
  { id: 'dk_am_t01', table: 'adjetivo-misto', sentence: 'Ein kalt_BLANK_ Wind wehte.', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'Um vento frio soprava.' },
  { id: 'dk_am_t02', table: 'adjetivo-misto', sentence: 'Ein schrecklich_BLANK_ Tag!', ending: 'er', case: 'nom', gender: 'm', number: 'sg', translation: 'Um dia horrível!' },
  { id: 'dk_am_t03', table: 'adjetivo-misto', sentence: 'Eine gut_BLANK_ Frage.', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Uma boa pergunta.' },
  { id: 'dk_am_t04', table: 'adjetivo-misto', sentence: 'Eine schön_BLANK_ Abendsonne!', ending: 'e', case: 'nom', gender: 'f', number: 'sg', translation: 'Que belo sol da tarde!' },
  { id: 'dk_am_t05', table: 'adjetivo-misto', sentence: 'Ein schön_BLANK_ Zimmer!', ending: 'es', case: 'nom', gender: 'n', number: 'sg', translation: 'Um quarto bonito!' },
  { id: 'dk_am_t06', table: 'adjetivo-misto', sentence: 'Ein gut_BLANK_ Herz lügt nicht.', ending: 'es', case: 'nom', gender: 'n', number: 'sg', translation: 'Um bom coração não mente.' },
  { id: 'dk_am_t07', table: 'adjetivo-misto', sentence: 'Keine geheim_BLANK_ Songs mehr!', ending: 'en', case: 'nom', gender: 'm', number: 'pl', translation: 'Chega de canções secretas!' },
  { id: 'dk_am_t08', table: 'adjetivo-misto', sentence: 'Keine ander_BLANK_ Menschen sind da.', ending: 'en', case: 'nom', gender: 'm', number: 'pl', translation: 'Não há outras pessoas aqui.' },
  { id: 'dk_am_t09', table: 'adjetivo-misto', sentence: 'Er hat einen gut_BLANK_ Ruf.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Ele tem boa reputação.' },
  { id: 'dk_am_t10', table: 'adjetivo-misto', sentence: 'Er kauft einen alt_BLANK_ Hut.', ending: 'en', case: 'akk', gender: 'm', number: 'sg', translation: 'Ele compra um chapéu velho.' },
  { id: 'dk_am_t11', table: 'adjetivo-misto', sentence: 'Er hat eine fix_BLANK_ Idee.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Ele tem uma ideia fixa.' },
  { id: 'dk_am_t12', table: 'adjetivo-misto', sentence: 'Er hat eine lang_BLANK_ Nase.', ending: 'e', case: 'akk', gender: 'f', number: 'sg', translation: 'Ele tem um nariz comprido.' },
  { id: 'dk_am_t13', table: 'adjetivo-misto', sentence: 'Er hat ein gut_BLANK_ Herz.', ending: 'es', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele tem um bom coração.' },
  { id: 'dk_am_t14', table: 'adjetivo-misto', sentence: 'Hat er ein groß_BLANK_ Haus?', ending: 'es', case: 'akk', gender: 'n', number: 'sg', translation: 'Ele tem uma casa grande?' },
  { id: 'dk_am_t15', table: 'adjetivo-misto', sentence: 'Macht keine halb_BLANK_ Sachen!', ending: 'en', case: 'akk', gender: 'f', number: 'pl', translation: 'Não façam as coisas pela metade!' },
  { id: 'dk_am_t16', table: 'adjetivo-misto', sentence: 'Ich mag keine groß_BLANK_ Städte.', ending: 'en', case: 'akk', gender: 'f', number: 'pl', translation: 'Não gosto de cidades grandes.' },
  { id: 'dk_am_t17', table: 'adjetivo-misto', sentence: 'Er kam aus einem ander_BLANK_ Land.', ending: 'en', case: 'dat', gender: 'n', number: 'sg', translation: 'Ele veio de outro país.' },
  { id: 'dk_am_t18', table: 'adjetivo-misto', sentence: 'Sie tanzt mit einem ander_BLANK_ Mann.', ending: 'en', case: 'dat', gender: 'm', number: 'sg', translation: 'Ela dança com outro homem.' },
  { id: 'dk_am_t19', table: 'adjetivo-misto', sentence: 'Er ist von einer ander_BLANK_ Welt.', ending: 'en', case: 'dat', gender: 'f', number: 'sg', translation: 'Ele é de outro mundo.' },
  { id: 'dk_am_t20', table: 'adjetivo-misto', sentence: 'Das führt zu einer neu_BLANK_ Frage.', ending: 'en', case: 'dat', gender: 'f', number: 'sg', translation: 'Isso leva a uma nova pergunta.' },
  { id: 'dk_am_t21', table: 'adjetivo-misto', sentence: 'Tom kam aus einem gut_BLANK_ Haus.', ending: 'en', case: 'dat', gender: 'n', number: 'sg', translation: 'Tom veio de uma boa família.' },
  { id: 'dk_am_t22', table: 'adjetivo-misto', sentence: 'Tom kommt aus einem gut_BLANK_ Stall.', ending: 'en', case: 'dat', gender: 'n', number: 'sg', translation: 'Tom vem de uma boa linhagem.' },
  { id: 'dk_am_t23', table: 'adjetivo-misto', sentence: 'Ich wachte plötzlich auf wegen eines laut_BLANK_ Krachs.', ending: 'en', case: 'gen', gender: 'm', number: 'sg', translation: 'Acordei de repente por causa de um estrondo alto.' },
  { id: 'dk_am_t24', table: 'adjetivo-misto', sentence: 'Er konnte wegen eines stark_BLANK_ Sturms nicht hinausgehen.', ending: 'en', case: 'gen', gender: 'm', number: 'sg', translation: 'Ele não pôde sair por causa de uma forte tempestade.' },
  { id: 'dk_am_t25', table: 'adjetivo-misto', sentence: 'Mach dir wegen einer solch_BLANK_ Kleinigkeit keine Sorgen.', ending: 'en', case: 'gen', gender: 'f', number: 'sg', translation: 'Não se preocupe com assunto tão insignificante.' },
  { id: 'dk_am_t26', table: 'adjetivo-misto', sentence: 'Er fährt wegen einer dringend_BLANK_ Angelegenheit nach Osaka.', ending: 'en', case: 'gen', gender: 'f', number: 'sg', translation: 'Ele vai a Osaka por causa de um assunto urgente.' },
  { id: 'dk_am_t27', table: 'adjetivo-misto', sentence: 'Wegen eines plötzlich_BLANK_ Ereignisses fiel der Zug aus.', ending: 'en', case: 'gen', gender: 'n', number: 'sg', translation: 'Por causa de um evento repentino, o trem foi cancelado.' },
]
