import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const en = [
  `Once upon a midnight dreary, while I pondered, weak and weary,
Over many a quaint and curious volume of forgotten lore,
While I nodded, nearly napping, suddenly there came a tapping,
As of some one gently rapping, rapping at my chamber door.
"'Tis some visiter," I muttered, "tapping at my chamber door—
Only this, and nothing more."`,
  `Ah, distinctly I remember it was in the bleak December,
And each separate dying ember wrought its ghost upon the floor.
Eagerly I wished the morrow;—vainly I had sought to borrow
From my books surcease of sorrow—sorrow for the lost Lenore—
For the rare and radiant maiden whom the angels name Lenore—
Nameless here for evermore.`,
  `And the silken sad uncertain rustling of each purple curtain
Thrilled me—filled me with fantastic terrors never felt before;
So that now, to still the beating of my heart, I stood repeating
"'Tis some visiter entreating entrance at my chamber door—
Some late visiter entreating entrance at my chamber door;—
This it is, and nothing more."`,
  `Presently my soul grew stronger; hesitating then no longer,
"Sir," said I, "or Madam, truly your forgiveness I implore;
But the fact is I was napping, and so gently you came rapping,
And so faintly you came tapping, tapping at my chamber door,
That I scarce was sure I heard you"—here I opened wide the door;——
Darkness there, and nothing more.`,
  `Deep into that darkness peering, long I stood there wondering, fearing,
Doubting, dreaming dreams no mortal ever dared to dream before;
But the silence was unbroken, and the darkness gave no token,
And the only word there spoken was the whispered word, "Lenore!"
This I whispered, and an echo murmured back the word, "Lenore!"
Merely this, and nothing more.`,
  `Back into the chamber turning, all my soul within me burning,
Soon I heard again a tapping somewhat louder than before.
"Surely," said I, "surely that is something at my window lattice;
Let me see, then, what thereat is, and this mystery explore—
Let my heart be still a moment and this mystery explore;—
'Tis the wind and nothing more!"`,
  `Open here I flung the shutter, when, with many a flirt and flutter,
In there stepped a stately raven of the saintly days of yore;
Not the least obeisance made he; not an instant stopped or stayed he;
But, with mien of lord or lady, perched above my chamber door—
Perched upon a bust of Pallas just above my chamber door—
Perched, and sat, and nothing more.`,
  `Then this ebony bird beguiling my sad fancy into smiling,
By the grave and stern decorum of the countenance it wore,
"Though thy crest be shorn and shaven, thou," I said, "art sure no craven,
Ghastly grim and ancient raven wandering from the Nightly shore—
Tell me what thy lordly name is on the Night's Plutonian shore!"
Quoth the raven, "Nevermore."`,
  `Much I marvelled this ungainly fowl to hear discourse so plainly,
Though its answer little meaning—little relevancy bore;
For we cannot help agreeing that no living human being
Ever yet was blessed with seeing bird above his chamber door—
Bird or beast upon the sculptured bust above his chamber door,
With such name as "Nevermore."`,
  `But the raven, sitting lonely on the placid bust, spoke only
That one word, as if his soul in that one word he did outpour.
Nothing farther then he uttered—not a feather then he fluttered—
Till I scarcely more than muttered "Other friends have flown before—
On the morrow he will leave me, as my hopes have flown before."
Then the bird said "Nevermore."`,
  `Startled at the stillness broken by reply so aptly spoken,
"Doubtless," said I, "what it utters is its only stock and store
Caught from some unhappy master whom unmerciful Disaster
Followed fast and followed faster till his songs one burden bore—
Till the dirges of his Hope that melancholy burden bore
Of 'Never—nevermore.'"`,
  `But the raven still beguiling all my sad soul into smiling,
Straight I wheeled a cushioned seat in front of bird, and bust and door;
Then, upon the velvet sinking, I betook myself to linking
Fancy unto fancy, thinking what this ominous bird of yore—
What this grim, ungainly, ghastly, gaunt, and ominous bird of yore
Meant in croaking "Nevermore."`,
  `This I sat engaged in guessing, but no syllable expressing
To the fowl whose fiery eyes now burned into my bosom's core;
This and more I sat divining, with my head at ease reclining
On the cushion's velvet lining that the lamplight gloated o'er,
But whose velvet violet lining with the lamplight gloating o'er,
She shall press, ah, nevermore!`,
  `Then, methought, the air grew denser, perfumed from an unseen censer
Swung by angels whose faint foot-falls tinkled on the tufted floor.
"Wretch," I cried, "thy God hath lent thee—by these angels he hath sent thee
Respite—respite and nepenthe from thy memories of Lenore!
Quaff, oh quaff this kind nepenthe and forget this lost Lenore!"
Quoth the raven, "Nevermore."`,
  `"Prophet!" said I, "thing of evil!—prophet still, if bird or devil!—
Whether Tempter sent, or whether tempest tossed thee here ashore,
Desolate yet all undaunted, on this desert land enchanted—
On this home by Horror haunted—tell me truly, I implore—
Is there—is there balm in Gilead?—tell me—tell me, I implore!"
Quoth the raven, "Nevermore."`,
  `"Prophet!" said I, "thing of evil—prophet still, if bird or devil!
By that Heaven that bends above us—by that God we both adore—
Tell this soul with sorrow laden if, within the distant Aidenn,
It shall clasp a sainted maiden whom the angels name Lenore—
Clasp a rare and radiant maiden whom the angels name Lenore."
Quoth the raven, "Nevermore."`,
  `"Be that word our sign of parting, bird or fiend!" I shrieked, upstarting—
"Get thee back into the tempest and the Night's Plutonian shore!
Leave no black plume as a token of that lie thy soul hath spoken!
Leave my loneliness unbroken!—quit the bust above my door!
Take thy beak from out my heart, and take thy form from off my door!"
Quoth the raven, "Nevermore."`,
  `And the raven, never flitting, still is sitting, still is sitting
On the pallid bust of Pallas just above my chamber door;
And his eyes have all the seeming of a demon's that is dreaming,
And the lamp-light o'er him streaming throws his shadow on the floor;
And my soul from out that shadow that lies floating on the floor
Shall be lifted—nevermore!`,
]

const pt = [
  `Em certo dia, á hora, á hora
Da meia-noite que apavora,
Eu, cahindo de somno e exausto de fadiga,
Ao pé de muita lauda antiga,
De uma velha doutrina, agora morta,
Ia pensando, quando ouvi á porta
Do meu quarto um soar devagarinho,
E disse estas palavras taes:
«É alguem que me bate á porta de mansinho;
«Ha de ser isso e nada mais.»`,
  `Ah! bem me lembro! bem me lembro!
Era no glacial Dezembro;
Cada braza do lar sobre o chão reflectia
A sua ultima agonia.
Eu, ancioso pelo sol, buscava
Saccar d’aquelles livros que estudava
Repouso (em vão!) á dôr esmagadora
D’estas saudades immortaes
Pela que ora nos céus anjos chamam Lenora,
E que ninguem chamará mais.`,
  `E o rumor triste, vago, brando
Das cortinas ia acordando
Dentro em meu coração um rumor não sabido
Nunca por elle padecido.
Emfim, por applacal-o aqui no peito,
Levantei-me de prompto, e: «Com effeito,
(Disse) é visita amiga e retardada
«Que bate a estas horas taes.
«É visita que pede á minha porta entrada:
«Ha de ser isso e nada mais.»`,
  `Minh’alma então sentiu-se forte;
Não mais vacillo e d’esta sorte
Fallo: «Imploro de vós, — ou senhor ou senhora,
«Me desculpeis tanta demora.
«Mas como eu, precisado de descanço,
«Já cochilava, e tão de manso e manso
«Batestes, não fui logo, prestemente,
«Certificar-me que ahi estaes.»
Disse; a porta escancaro, acho a noite somente,
Sómente a noite, e nada mais.`,
  `Com longo olhar escruto a sombra,
Que me amedronta, que me assombra,
E sonho o que nenhum mortal ha já sonhado,
Mas o silencio amplo e calado,
Calado fica; a quietação quieta;
Só tu, palavra unica e dilecta,
Lenora, tu, como um suspiro escasso,
Da minha triste boca saes;
E o eco, que te ouviu, murmurou-te no espaço;
Foi isso apenas, nada mais.`,
  `Entro co’ a alma incendiada.
Logo depois outra pancada
Sôa um pouco mais forte; eu, voltando-me a ella:
«Seguramente, ha na janella
«Alguma cousa que sussura. Abramo
«Eia, fôra o temor, eia, vejamos
«A explicação do caso mysterioso
«D’essas duas pancadas taes.
«Devolvamos a paz ao coração medroso,
«Obra do vento e nada mais.»`,
  `Abro a janella, e de repente,
Vejo tumultuosamente
Um nobre corvo entrar, digno de antigos dias.
Não despendeu em cortezias
Um minuto, um instante. Tinha o aspecto
De um lord ou de uma lady. E prompto e recto
Movendo no ar as suas negras alas,
Acima vôa dos portaes,
Trepa, no alto da porta, em um busto de Pallas;
Trepado fica, e nada mais.`,
  `Diante da ave feia e escura,
Naquella rigida postura,
Com o gesto severo, — o triste pensamento
Sorriu-me alli por um momento,
E eu disse: «Ó tu que das nocturnas plagas
«Vens, embora a cabeça nua tragas,
«Sem topete, não és ave medrosa,
«Dize as teus nomes senhoriaes;
«Como te chamas tu na grande noite umbrosa?»
E o corvo disse; «Nunca mais.»`,
  `Vendo que o passaro entendia
A pergunta que lhe eu fazia,
Fico attonito, embora a resposta que dera
Difficilmente lh’a entendera.
Na verdade, jamais homem ha visto
Cousa na terra semelhante a isto:
Uma ave negra, friamente posta
N’um busto, acima dos portaes,
Ouvir uma pergunta e dizer em resposta
Que este é seu nome: «Nunca mais.»`,
  `No emtanto, o corvo solitario
Não teve outro vocabulario,
Como se essa palavra escassa que alli disse
Toda a sua alma resumisse.
Nenhuma outra proferiu, nenhuma,
Não chegou a mexer uma só pluma,
Até que eu murmurei: «Perdi outr’ora
Tantos amigos tão leaes!
«Perdeirei tambem este em regressando a aurora.»
E o corvo disse: «Nunca mais!»`,
  `Estremeço. A resposta ouvida
É tão exacta! é tão cabida!
«Certamente, digo eu, essa é toda a sciencia
«Que elle trouxe da convivéncia
«De algum mestre infeliz e acabrunhado
«Que o implacavel destino ha castigado
«Tão tenaz, tão sem pausa, nem fadiga,
«Que dos seus cantos usuaes
«Só lhe ficou, na amarga e ultima cantiga,
«Esse estribilho: «Nunca mais.»`,
  `Segunda vez, nesse momento,
Sorriu-me o triste pensamento;
Vou sentar-me defronte ao corvo magro e rudo;
E mergulhando no velludo
Da poltrona que eu mesmo alli trouxera
Achar procuro a lugubre chimera,
A alma, o sentido, o pavido segredo
Daquellas syllabas fataes,
Entender o que quiz dizer a ave do medo
Grasnando a phrase: — Nunca mais.`,
  `Assim posto, devaneando,
Meditando, conjecturando,
Não lhe fallava mais; mas, se lhe não fallava,
Sentia o olhar que me abrazava.
Conjecturando fui, tranquillo, a gosto,
Com a cabeça no macio encosto
Onde os raios da lampada cahiam
Onde as tranças angelicaes
De outra cabeça outr’ora alli se desparziam,
E agora não se esparzem mais.`,
  `Suppuz então que o ar, mais denso,
Todo se enchia de um incenso,
Obra de seraphins que, pelo chão roçando
Do quarto, estavam meneando
Um ligeiro thuribulo invisivel;
E eu exclamei então: «Um Deus sensivel
«Manda repouso á dor que te devora
«D’estas saudades immortaes.
«Eia, esquece, eia, olvida essa extincta Lenora.»
E o corvo disse: «Nunca mais.»`,
  `«Propheta, ou o que quer que sejas!
«Ave ou demonio que negrejas!
«Propheta sempre, escuta: Ou venhas tu do inferno
«Onde reside o mal eterno,
«Ou simplesmente naufrago escapado
«Venhas do temporal que te ha lançado
«N’esta casa onde o Horror, o Horror profundo
«Tem os seus lares triumphaes,
«Dize-me: existe acaso um balsamo no mundo?»
E o corvo disse: «Nunca mais.»`,
  `«Propheta, ou o que quer que sejas!
«Ave ou demonio que negrejas!
«Propheta sempre, escuta, attende, escuta, attende!
«Por esse céu que alem se estende,
«Pelo Deus que ambos adoramos, falla,
«Dize a esta alma se é dado inda escutal-a
«No Eden celeste a virgem que ella chora
«Nestes retiros sepulchraes,
«Essa que ora nos ceus anjos chamam Lenora!»
E o corvo disse: «Nunca mais.»`,
  `«Ave ou demonio que negrejas!
«Propheta, ou o que quer que sejas!
«Cessa, ai, cessa! clamei, levantando-me, cessa!
«Regressa ao temporal, regressa
«Á tua noite, deixa-me commigo.
«Vae-te, não fique no meu casto abrigo
«Pluma que lembre essa mentira tua.
«Tira-me ao peito essas fataes
«Garras que abrindo vão a minha dor já crua.»
E o corvo disse: «Nunca mais.»`,
  `E o corvo ahi fica; eil-o trepado
No branco marmore lavrado
Da antiga Pallas; eil-o immutavel, ferrenho.
Parece, ao ver-lhe o duro cenho,
Um demonio sonhando. A luz cahida
Do lampeão sobre a ave aborrecida
No chão espraia a triste sombra; e fóra
D’aquellas linhas funeraes
Que fluctuam no chão, a minha alma que chora
Não sai mais, nunca, nunca mais!`,
]

const es = [
  `Una fosca media noche, cuando en tristes reflexiones,
sobre más de un raro infolio de olvidados cronicones
inclinaba soñoliento la cabeza, de repente
a mi puerta oí llamar:
como si alguien, suavemente, se pusiese con incierta
mano tímida a tocar:
«Es—me dije—una visita que llamando está a mi puerta:
eso es todo y nada más!»`,
  `¡Ah! Bien claro lo recuerdo: era el crudo mes del hielo,
y su espectro cada brasa moribunda enviaba al suelo.
Cuán ansioso el nuevo día deseaba, en la lectura
procurando en vano hallar
tregua a la honda desventura de la muerte de Leonora,
la radiante, la sin par
vírgen pura a quien Leonora los querubes llaman, hora
ya sin nombre... ¡nunca más!`,
  `Y el crujido triste, incierto, de las rojas colgaduras
me aterraba, me llenaba de fantásticas pavuras,
de tal modo que el latido de mi pecho palpitante
procurando dominar,
«es, sin duda, un visitante—repetía con instancia—
que a mi alcoba quiere entrar:
un tardío visitante a las puertas de mi estancia..
eso es todo, y nada más!»`,
  `Paso a paso, fuerza y bríos
fue mi espíritu cobrando:
«Caballero—dije—o dama:
mil perdones os demando;
mas, el caso es que dormía,
y con tanta gentileza
me vinisteis a llamar,
y con tal delicadeza
y tan tímida constancia
os pusísteis a tocar,
que no oí»—dije—y las puertas
abrí al punto de mi estancia;
¡sombras sólo y...
nada más!`,
  `Mudo, trémulo, en la sombra por mirar haciendo empeños,
quedé allí, cual antes nadie los soñó, forjando sueños;
más profundo era el silencio, y la calma no acusaba
ruido alguno... Resonar
sólo un nombre se escuchaba que en voz baja a aquella hora
yo me puse a murmurar,
y que el eco repetía como un soplo: ¡Leonora...!
esto apenas, ¡nada más!`,
  `A mi alcoba retornando con el alma en turbulencia,
pronto oí llamar de nuevo,—esta vez con más violencia,
«De seguro—dije—es algo que se posa en mi persiana;
pues, veamos de encontrar
la razón abierta y llana de este caso raro y serio,
y el enigma averiguar.
¡Corazón! Calma un instante, y aclaremos el misterio...
—Es el viento—y nada más!»`,
  `La ventana abrí—y con rítmico aleteo y garbo extraño
entró un cuervo majestuoso de la sacra edad de antaño.
Sin pararse ni un instante ni señales dar de susto,
con aspecto señorial,
fué a posarse sobre un busto de Minerva que ornamenta
de mi puerta el cabezal;
sobre el busto que de Palas la figura representa,
fué y posóse—¡y nada más!`,
  `Trocó entonces el negro pájaro en sonrisas mi tristeza
con su grave, torva y seria, decorosa gentileza;
y le dije: «Aunque la cresta calva llevas, de seguro
no eres cuervo nocturnal,
viejo, infausto cuervo obscuro, vagabundo en la tiniebla...
Díme:—«¿Cuál tu nombre, cuál
en el reino plutoniano de la noche y de la niebla?...»
Dijo el cuervo: «¡Nunca más!.»`,
  `Asombrado quedé oyendo así hablar al avechucho,
si bien su árida respuesta no expresaba poco o mucho;
pues preciso es convengamos en que nunca hubo criatura
que lograse contemplar
ave alguna en la moldura de su puerta encaramada,
ave o bruto reposar
sobre efigie en la cornisa de su puerta, cincelada,
con tal nombre: «¡Nunca más!».`,
  `Mas el cuervo, fijo, inmóvil, en la grave efigie aquella,
sólo dijo esa palabra, cual si su alma fuese en ella
vinculada—ni una pluma sacudía, ni un acento
se le oía pronunciar...
Dije entonces al momento: «Ya otros antes se han marchado,
y la aurora al despuntar,
él también se irá volando cual mis sueños han volado.»
Dijo el cuervo: «¡Nunca más!»`,
  `Por respuesta tan abrupta como justa sorprendido,
«no hay ya duda alguna—dije—lo que dice es aprendido;
aprendido de algún amo desdichado a quien la suerte
persiguiera sin cesar,
persiguiera hasta la muerte, hasta el punto de, en su duelo,
sus canciones terminar
y el clamor de su esperanza con el triste ritornelo
de jamás, ¡y nunca más!»`,
  `Mas el cuervo provocando mi alma triste a la sonrisa,
mi sillón rodé hasta el frente al ave, al busto, a la cornisa;
luego, hundiéndome en la seda, fantasía y fantasía
dime entonces a juntar,
por saber qué pretendía aquel pájaro ominoso
de un pasado inmemorial,
aquel hosco, torvo, infausto, cuervo lúgubre y odioso
al graznar: «¡Nunca jamás!»`,
  `Quedé aquesto investigando frente al cuervo, en honda calma,
cuyos ojos encendidos me abrasaban pecho y alma.
Esto y más—sobre cojines reclinado—con anhelo
me empeñaba en descifrar,
sobre el rojo terciopelo do imprimía viva huella
luminosa mi fanal—
terciopelo cuya púrpura ¡ay! jamás volverá élla
a oprimir—¡Ah! ¡Nunca más!`,
  `Parecióme el aire, entonces,
por incógnito incensario
que un querube columpiase
de mi alcoba en el santuario,
perfumado—«Miserable sér—me dije—Dios te ha oído,
y por medio angelical,
tregua, tregua y el olvido del recuerdo de Leonora
te ha venido hoy a brindar:
¡bebe! bebe ese nepente, y así todo olvida ahora.
Dijo el cuervo: «¡Nunca más!»`,
  `«Eh, profeta—dije—o duende,
mas profeta al fin, ya seas
ave o diablo—ya te envíe
la tormenta, ya te veas
por los ábregos barrido a esta playa,
desolado
pero intrépido a este hogar
por los males devastado,
dime, dime, te lo imploro:
¿Llegaré jamas a hallar
algún bálsamo o consuelo para el mal que triste lloro?»
Dijo el cuervo: «¡Nunca más!»`,
  `«¡Oh, Profeta—dije—o diablo—Por ese ancho combo velo
de zafir que nos cobija, por el mismo Dios del Cielo
a quien ambos adoramos, dile a esta alma adolorida,
presa infausta del pesar,
sí jamás en otra vida la doncella arrobadora
a mi seno he de estrechar,
la alma virgen a quien llaman los arcángeles Leonora!»
Dijo el cuervo: «¡Nunca más!»`,
  `«Esa voz,
oh cuervo, sea
la señal
de la partida.
grité alzándome:—¡Retorna,
vuelve a tu hórrida guarida,
la plutónica ribera de la noche y de la bruma!...
de tu horrenda falsedad
en memoria, ni una pluma dejes, negra, ¡El busto deja!
¡Deja en paz mi soledad!
¡Quita el pico de mi pecho! De mi umbral tu forma aleja...»
Dijo el cuervo: «¡Nunca más!»`,
  `Y aún el cuervo inmóvil, fijo, sigue fijo en la escultura,
sobre el busto que ornamenta de mi puerta la moldura...
y sus ojos son los ojos de un demonio que, durmiendo,
las visiones ve del mal;
y la luz sobre él cayendo, sobre el suelo arroja trunca
su ancha sombra funeral,
y mi alma de esa sombra que en el suelo flota...¡nunca
se alzará... nunca jamás!`,
]

if (en.length !== pt.length || en.length !== es.length) {
  throw new Error(`stanza counts ${en.length} ${pt.length} ${es.length}`)
}

const book = {
  id: "the-raven",
  languages: ["en", "pt", "es"],
  title: { en: "The Raven", pt: "O corvo", es: "El cuervo" },
  authors: [
    { name: "Edgar Allan Poe", role: "Author", years: "1809–1849" },
    { name: "Machado de Assis", role: "Portuguese translator", years: "1839–1908" },
    { name: "Juan Antonio Pérez Bonalde", role: "Spanish translator", years: "1846–1892" },
  ],
  year: 1845,
  summary:
    "A midnight visitor, a lost Lenore, and a bird with a single word. Poe’s poem beside Machado de Assis in Portuguese and Pérez Bonalde in Spanish, stanza by stanza.",
  rights: [
    {
      lang: "en",
      title: "The Raven",
      credit: "Edgar Allan Poe",
      edition: "The Raven and Other Poems, New York: Wiley and Putnam, 1845, pp. 1–5.",
      source: "https://en.wikisource.org/wiki/The_Raven_and_Other_Poems/The_Raven",
      rationale:
        "Poe died in 1849. This text is the 1845 authorized collection. In the United States every work published in 1845 is in the public domain. Elsewhere the author’s life ended more than a century ago, so the poem is in the public domain.",
    },
    {
      lang: "pt",
      title: "O corvo",
      credit: "Machado de Assis, after Edgar Allan Poe",
      edition: "Poesias completas, Rio de Janeiro: Livraria Garnier, 1902, pp. 299–305 (Ocidentais). The translation first appeared in 1883.",
      source: "https://pt.wikisource.org/wiki/O_Corvo_(tradu%C3%A7%C3%A3o_de_Machado_de_Assis)",
      rationale:
        "The translation is Machado’s, not a later translator’s. He died in 1908. Brazil, Portugal, and the European Union use a term of life plus 70 years, so this text entered the public domain at the start of 1979. The 1902 printing is followed here, including two words Wikisource marks as printer’s errors: “sussura” and “Dize as teus nomes”.",
    },
    {
      lang: "es",
      title: "El cuervo",
      credit: "Juan Antonio Pérez Bonalde, after Edgar Allan Poe",
      edition:
        "Translation first published New York: La América Publishing Co. / E. P. Dutton, 1 April 1887. Reading text from the 1919 Montevideo reprint in Poemas (Claudio García), as transcribed on Spanish Wikisource.",
      source: "https://es.wikisource.org/wiki/El_cuervo_(P%C3%A9rez_Bonalde_tr.)",
      rationale:
        "Pérez Bonalde died in 1892. A life-plus-70 or life-plus-80 term (Spain, Venezuela, the European Union, Brazil) expired in the twentieth century. The 1887 United States copyright notice expired long before the 1930 cutoff that now governs older US publications. The 1919 reprint does not create a new copyright in his translation.",
    },
  ],
  chapters: [
    {
      id: "poem",
      title: { en: "The Raven", pt: "O corvo", es: "El cuervo" },
      paragraphs: en.map((text, index) => ({
        id: `s${String(index + 1).padStart(2, "0")}`,
        en: text,
        pt: pt[index],
        es: es[index],
      })),
    },
  ],
}

const dir = path.resolve("content/the-raven")
await mkdir(dir, { recursive: true })
await writeFile(path.join(dir, "book.json"), JSON.stringify(book, null, 2) + "\n")
console.log("wrote", en.length, "stanzas")
