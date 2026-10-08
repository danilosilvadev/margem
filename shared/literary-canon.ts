/** Literary eras and the influence tree. Ported from O Cenáculo and translated.
 * An author with no work on this shelf is a ghost: a dashed medallion.
 * The graph is the same shape as the original canon.
 */

export type EraId =
  | "antiguidade-grega"
  | "antiguidade-romana"
  | "medieval"
  | "renascimento"
  | "barroco-iluminismo"
  | "romantismo"
  | "realismo"
  | "modernismo"
  | "contemporaneo"

export type Era = {
  id: EraId
  name: string
  startYear: number
  endYear: number
  color: string
  ink: string
  summary: string
  marks: string[]
  beats: string[]
  citation: { text: string; author: string }
}

export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year)
}

export function formatRange(start: number, end: number): string {
  return `${formatYear(start)} – ${formatYear(end)}`
}

/** "Trojan War (-1200)" → "Trojan War (1200 BCE)". */
export function formatMark(mark: string): string {
  return mark.replace(/\(-(\d+)\)/g, "($1 BCE)")
}

export const ERAS: Era[] = [
  {
    id: "antiguidade-grega",
    name: "Greek Antiquity",
    startYear: -800,
    endYear: -100,
    color: "#c9a875",
    ink: "#3a2a1c",
    summary:
      "From Homer’s oral poetry to Aristotle’s philosophy. Greece invents epic, tragedy, comedy, philosophy, and history. Almost every Western literary form starts here.",
    marks: ["Trojan War (-1200)", "Democratic Athens (-507)", "Alexander’s conquests (-336)"],
    beats: [
      "Eighth century before the common era. A blind bard walks the Aegean islands singing an old war.",
      "For generations the verses pass from mouth to mouth. Achilles, Hector, and Odysseus take shape in a shared memory.",
      "When they are finally written down, they give Greece its mythology, its morals, and its idea of a hero.",
      "From the same ground come Athenian tragedy, the questions of Socrates and Plato, and Herodotus’s history.",
      "Almost every Western literary form has its pattern here. Everything after is a conversation with this beginning.",
    ],
    citation: { text: "μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος", author: "Homer, Iliad, opening line" },
  },
  {
    id: "antiguidade-romana",
    name: "Roman Antiquity",
    startYear: -100,
    endYear: 500,
    color: "#a85a3d",
    ink: "#fff8e8",
    summary:
      "Rome adapts the Greek models: epic in Virgil, Stoic philosophy in Seneca and Marcus Aurelius, rhetoric in Cicero. Augustine carries the classical mind into Christian prose.",
    marks: ["Roman Republic (-509)", "Augustus’s empire (-27)", "Sack of Rome (410)"],
    beats: [
      "Rome conquers Greece, and Greece conquers Rome.",
      "Virgil writes the Aeneid to give a military people a poetic soul. Seneca and Marcus Aurelius turn Greek Stoicism toward someone who governs an empire.",
      "Cicero teaches Latin how to speak in public. For a thousand years after, people learn to write by reading him.",
      "As the empire starts to fail, a North African bishop named Augustine writes the Confessions and, without planning it, the Western interior autobiography.",
      "Rome falls in 476. Virgil’s Latin and Seneca’s philosophy cross the wreck.",
    ],
    citation: { text: "Memento mori.", author: "A Roman Stoic refrain: remember that you will die" },
  },
  {
    id: "medieval",
    name: "Middle Ages",
    startYear: 500,
    endYear: 1400,
    color: "#7a2538",
    ink: "#f4d9a8",
    summary:
      "A thousand years of Christian letters, scholastic argument, and chivalric romance. Aquinas joins Aristotle to the church. Dante crowns the age in the Comedy.",
    marks: ["Charlemagne (800)", "East–West schism (1054)", "Black Death (1347)"],
    beats: [
      "A thousand years pass. Latin becomes liturgy. Monasteries copy manuscripts by hand. Few people can read.",
      "Something still travels: courtly song, chivalric romance, the stories of Arthur. A Christian hero takes Achilles’s place.",
      "In the thirteenth century Aquinas does the unlikely thing: he sets Aristotle beside Christian doctrine, and the church accepts the mix.",
      "Around 1300, in a Florentine exile, Dante begins the poem that will crown the age. He writes it in Italian, not Latin.",
      "When the Comedy ends, the Middle Ages are already turning. The printing press is a century away.",
    ],
    citation: { text: "Lasciate ogne speranza, voi ch’intrate.", author: "Dante, Inferno III" },
  },
  {
    id: "renascimento",
    name: "Renaissance",
    startYear: 1400,
    endYear: 1620,
    color: "#3a6e4a",
    ink: "#f4ead6",
    summary:
      "Europe finds the ancients again. Gutenberg’s press multiplies books. Machiavelli writes a science of power, Cervantes the modern novel, Shakespeare a new stage.",
    marks: ["Printing press (1450)", "Voyage to America (1492)", "Reformation (1517)"],
    beats: [
      "Florence finds the ancients again. Petrarch hunts forgotten manuscripts. Boccaccio writes a hundred stories. In 1450 Gutenberg changes the supply of books.",
      "For the first time the book is no longer rare. Ideas move at the speed of a workshop.",
      "In 1513 Machiavelli, exiled and out of work, writes The Prince, the most argued book yet made about power.",
      "In 1605 a Spanish veteran who lost the use of a hand in the wars publishes Don Quixote. He invents the modern novel without announcing it.",
      "In the same decades, in London, a glover’s son named Shakespeare remakes the theater. Literature steps into the modern world.",
    ],
    citation: { text: "è più sicuro essere temuto che amato", author: "Machiavelli, Il Principe, XVII" },
  },
  {
    id: "barroco-iluminismo",
    name: "Baroque & Enlightenment",
    startYear: 1620,
    endYear: 1789,
    color: "#1f4d6b",
    ink: "#e8d6a8",
    summary:
      "Newton’s science, the rationalists, Voltaire’s satire, and the first bourgeois novels. Reason and light are the ideals, until the Bastille falls.",
    marks: ["Galileo condemned (1633)", "English Revolution (1642)", "Encyclopédie (1751)"],
    beats: [
      "Reason takes the stage. In 1637 Descartes writes: I think, therefore I am.",
      "Pascal answers that a person is a thinking reed, and that the whole universe can crush that reed.",
      "Voltaire mocks easy optimism and attacks fanaticism. Diderot tries to gather human knowledge into one encyclopedia.",
      "In 1759 Laurence Sterne publishes Tristram Shandy, a novel that comes apart as it is made, a century and a half before modernism.",
      "The Bastille falls in 1789. The Enlightenment has become politics. Something else is starting.",
    ],
    citation: { text: "L’homme n’est qu’un roseau, le plus faible de la nature; mais c’est un roseau pensant.", author: "Pascal, Pensées" },
  },
  {
    id: "romantismo",
    name: "Romanticism",
    startYear: 1789,
    endYear: 1850,
    color: "#5a2348",
    ink: "#e8d6a8",
    summary:
      "A reaction to the Enlightenment: passion, nature, the solitary hero, the nation. Goethe, Hugo, Schopenhauer. Brazil imports the model into a new empire.",
    marks: ["French Revolution (1789)", "Napoleon (1804)", "Brazilian independence (1822)"],
    beats: [
      "The revolution promised reason and delivered the guillotine. Napoleon promised equality and became an emperor.",
      "The young answer: enough of cold reason. They want passion, nature, medieval ruins, solitary heroes, nations.",
      "Goethe writes Werther, and across Europe young readers stage themselves after the character.",
      "In 1819 Schopenhauer argues that the will to live is the root of suffering. Almost nobody notices yet. Tolstoy, Nietzsche, and Machado will.",
      "In newly independent Brazil the court imports the Romantic model, and a national literature starts to be invented.",
    ],
    citation: { text: "Das Leben schwingt, gleich einem Pendel, hin und her zwischen Schmerz und Langeweile.", author: "Schopenhauer" },
  },
  {
    id: "realismo",
    name: "Realism & Naturalism",
    startYear: 1850,
    endYear: 1900,
    color: "#3a2a1c",
    ink: "#d9b26a",
    summary:
      "The novel becomes a lens on society. Flaubert, Tolstoy, Dostoevsky, Machado, Eça. The bourgeoisie, the province, and the underground of the soul.",
    marks: ["Paris Commune (1871)", "Abolition in Brazil (1888)", "Brazilian Republic (1889)"],
    beats: [
      "The novel tries to become a science. Flaubert spends years on Madame Bovary, working each sentence like a stone.",
      "In Petersburg, Dostoevsky comes back from Siberian exile and goes down into the underground of a person. At Yasnaya Polyana, Tolstoy writes the whole of a society.",
      "In imperial Rio, Machado de Assis reads Sterne and Schopenhauer and invents, quietly, a narrator who lies to the reader.",
      "Eça de Queirós does the neighboring work in Lisbon. The literature of Portuguese and Spanish enters the same argument as Paris and Petersburg.",
      "In 1888 Brazil abolishes slavery with no repair. In 1889 it becomes a republic. The novel is standing in the middle of that shock.",
    ],
    citation: {
      text: "Não tive filhos, não transmiti a nenhuma criatura o legado da nossa miséria.",
      author: "Machado de Assis, Memórias póstumas de Brás Cubas, last sentence",
    },
  },
  {
    id: "modernismo",
    name: "Modernism",
    startYear: 1900,
    endYear: 1945,
    color: "#2a2a2a",
    ink: "#c9b27c",
    summary:
      "The form breaks. Joyce, Proust, Kafka, Pessoa, Mário de Andrade. Stream of consciousness, fragments, the vanguards, with two world wars behind the page.",
    marks: ["First World War (1914)", "Modern Art Week, São Paulo (1922)", "Second World War (1939)"],
    beats: [
      "1914. The world goes to war on a scale it has not seen. When it stops, in 1918, the certainty that something has broken remains.",
      "The form of the novel follows. Proust writes lost time across seven volumes. Joyce rewrites the Odyssey as one day in Dublin.",
      "In a Prague apartment Kafka dreams that he has woken as an insect. The century will be Kafka’s before it has a word for that.",
      "In Lisbon, Pessoa invents heteronyms so he can be several people. In São Paulo, Mário de Andrade writes Macunaíma and founds Brazilian modernism in talk with the European vanguards.",
      "1939. Another war, worse than the first. When it ends, the literature that comes back is not the literature that left.",
    ],
    citation: {
      text: "Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt.",
      author: "Kafka, Die Verwandlung, 1915, first sentence",
    },
  },
  {
    id: "contemporaneo",
    name: "Contemporary",
    startYear: 1945,
    endYear: 2030,
    color: "#4a4538",
    ink: "#f4ead6",
    summary:
      "After the war: Camus and the absurd, the Latin American boom, Guimarães Rosa and Clarice. The Western canon stops pretending it was the whole world.",
    marks: ["Cold War (1947–1991)", "Latin American boom (1960s)", "Fall of the Berlin Wall (1989)"],
    beats: [
      "The postwar years are cold, split, and nuclear. Camus writes the absurd. Beckett writes the pause. Hemingway writes the silence.",
      "Something warmer grows in Latin America. García Márquez shuts himself in a room and comes out with a town called Macondo. That novel’s famous opening is still in copyright, so it is not printed here.",
      "In Minas Gerais, Guimarães Rosa invents a Portuguese nobody had written. In Recife, Clarice tears the sentence open to reach what a sentence usually refuses.",
      "The Western canon, sold for so long as universal, starts to be questioned. Women, Black writers, and Indigenous writers rewrite the shelf.",
      "You are here, at the near end of this line. Each book you open is the next note in a score about 2,700 years long.",
    ],
    citation: {
      text: "The famous first sentence of One Hundred Years of Solitude is still in copyright, so this page does not print it.",
      author: "García Márquez, 1967, named and not quoted",
    },
  },
]

export function eraOf(year: number): Era {
  return ERAS.find((era) => year >= era.startYear && year < era.endYear) ?? ERAS[ERAS.length - 1]
}

export type CanonAuthor = {
  id: string
  name: string
  bornYear: number
  diedYear?: number
  era: EraId
  nationality: string
  influencedBy: string[]
  mainParent?: string
  summary: string
  /** Work ids on the Margem shelf. Empty means a dashed medallion. */
  workIds: string[]
  ghost: boolean
}

function author(
  id: string,
  name: string,
  bornYear: number,
  diedYear: number | undefined,
  era: EraId,
  nationality: string,
  influencedBy: string[],
  summary: string,
  workIds: string[] = [],
): CanonAuthor {
  return {
    id,
    name,
    bornYear,
    diedYear,
    era,
    nationality,
    influencedBy,
    mainParent: influencedBy[0],
    summary,
    workIds,
    ghost: workIds.length === 0,
  }
}

export const CANON_AUTHORS: CanonAuthor[] = [
  author("homer", "Homer", -750, -700, "antiguidade-grega", "Greek", [], "The bard from whom Western literature still dates its start: the Iliad and the Odyssey.", ["iliad"]),
  author("hesiod", "Hesiod", -700, -650, "antiguidade-grega", "Greek", ["homer"], "Singer of divine origins and farm work: the Theogony and Works and Days."),
  author("sappho", "Sappho", -630, -570, "antiguidade-grega", "Greek", ["homer"], "The first lyric voice of Europe, surviving in fragments of love poetry."),
  author("aesop", "Aesop", -620, -560, "antiguidade-grega", "Greek", [], "The fable’s old moralist. The stories travel long after the man."),
  author("aeschylus", "Aeschylus", -525, -456, "antiguidade-grega", "Greek", ["homer"], "The first great tragedian. He put a second actor on the stage."),
  author("sophocles", "Sophocles", -496, -406, "antiguidade-grega", "Greek", ["aeschylus"], "Tragedy of human limit: Oedipus, Antigone, the fall of a worthy hero.", ["oedipus"]),
  author("euripides", "Euripides", -480, -406, "antiguidade-grega", "Greek", ["sophocles", "aeschylus"], "The most modern of the tragedians: psychology, women, and a hard look at the gods."),
  author("aristophanes", "Aristophanes", -446, -386, "antiguidade-grega", "Greek", ["euripides"], "Master of Athenian comedy, political satire, and the ridicule of philosophers."),
  author("herodotus", "Herodotus", -484, -425, "antiguidade-grega", "Greek", ["homer"], "Called the father of history: prose inquiry into the known world."),
  author("thucydides", "Thucydides", -460, -400, "antiguidade-grega", "Greek", ["herodotus"], "History as cold political analysis: the Peloponnesian War."),
  author("socrates", "Socrates", -470, -399, "antiguidade-grega", "Greek", [], "He wrote nothing. He taught the question. The dialectic starts with him."),
  author("plato", "Plato", -428, -348, "antiguidade-grega", "Greek", ["socrates"], "Socrates’s student. He turned philosophy into written dialogue and founded the Academy."),
  author("aristotle", "Aristotle", -384, -322, "antiguidade-grega", "Greek", ["plato"], "Plato’s student. He ordered logic, ethics, politics, living things, and poetry."),
  author("epictetus", "Epictetus", 50, 135, "antiguidade-grega", "Greek", ["socrates"], "A freed slave who taught practical Stoicism. The Enchiridion comes from his teaching."),
  author("cicero", "Cicero", -106, -43, "antiguidade-romana", "Roman", ["plato", "aristotle"], "Latin prose at full stretch: speeches, political philosophy, and letters the Renaissance learned to write from."),
  author("lucretius", "Lucretius", -99, -55, "antiguidade-romana", "Roman", [], "De rerum natura: an atomist poem that later science keeps recognizing."),
  author("virgil", "Virgil", -70, -19, "antiguidade-romana", "Roman", ["homer"], "The Aeneid: a Latin epic that gives Rome a founding myth.", ["aeneid"]),
  author("ovid", "Ovid", -43, 17, "antiguidade-romana", "Roman", ["virgil"], "The Metamorphoses: a mythic encyclopedia in verse that the Renaissance never put down."),
  author("seneca", "Seneca", -4, 65, "antiguidade-romana", "Roman", ["epictetus", "cicero"], "Applied Stoicism and dense tragedy. A direct model for Shakespeare and the Elizabethans."),
  author("marcus-aurelius", "Marcus Aurelius", 121, 180, "antiguidade-romana", "Roman", ["epictetus", "seneca"], "The emperor who kept a Stoic diary to himself: the Meditations."),
  author("augustine", "Augustine", 354, 430, "antiguidade-romana", "Roman", ["plato", "cicero"], "He Christianized Plato and invented the interior autobiography in the Confessions."),
  author("aquinas", "Thomas Aquinas", 1225, 1274, "medieval", "Italian", ["aristotle", "augustine"], "The synthesis of Christianity and Aristotle, a base of Western Catholic philosophy."),
  author("dante", "Dante Alighieri", 1265, 1321, "medieval", "Italian", ["virgil", "aquinas", "aristotle"], "The Divine Comedy. Virgil guides Dante through the afterlife and Italian literature finds its poem.", ["comedy"]),
  author("petrarch", "Francesco Petrarch", 1304, 1374, "medieval", "Italian", ["cicero", "virgil"], "A father of humanism. He recovers the Latin authors and shapes the modern sonnet."),
  author("boccaccio", "Giovanni Boccaccio", 1313, 1375, "medieval", "Italian", ["petrarch", "dante"], "The Decameron: a hundred medieval tales that open a road for modern prose."),
  author("machiavelli", "Niccolò Machiavelli", 1469, 1527, "renascimento", "Italian", ["cicero"], "He founds a modern science of politics in The Prince, written in exile in 1513."),
  author("rabelais", "François Rabelais", 1494, 1553, "renascimento", "French", ["boccaccio"], "Gargantua and Pantagruel: huge comic prose, satire of the schools, a flood of language."),
  author("montaigne", "Michel de Montaigne", 1533, 1592, "renascimento", "French", ["seneca", "cicero"], "He invents the essay: personal, skeptical, conversational. A spiritual father of Pascal."),
  author("cervantes", "Miguel de Cervantes", 1547, 1616, "renascimento", "Spanish", ["boccaccio", "rabelais"], "Don Quixote, the first modern novel: a satire of chivalric romance that becomes a book about books.", ["quixote"]),
  author("shakespeare", "William Shakespeare", 1564, 1616, "renascimento", "English", ["seneca", "ovid"], "The dramatist who takes in the European stage and then goes past it.", ["hamlet"]),
  author("pascal", "Blaise Pascal", 1623, 1662, "barroco-iluminismo", "French", ["montaigne", "augustine"], "The Pensées: fragments on faith, dread, and a person without God."),
  author("voltaire", "Voltaire", 1694, 1778, "barroco-iluminismo", "French", ["pascal", "montaigne"], "The Enlightenment’s satirist: Candide, tolerance, and a fine knife."),
  author("sterne", "Laurence Sterne", 1713, 1768, "barroco-iluminismo", "English", ["cervantes", "rabelais"], "Tristram Shandy, an experimental novel that jumps a century and a half toward modernism. Machado’s idol."),
  author("rousseau", "Jean-Jacques Rousseau", 1712, 1778, "barroco-iluminismo", "French", ["montaigne"], "The Confessions reinvent autobiography. The Social Contract founds a modern democratic theory."),
  author("goethe", "Johann Wolfgang von Goethe", 1749, 1832, "barroco-iluminismo", "German", ["shakespeare", "rousseau"], "Faust, novels, poems, science: the last universalist, and the model of German Romanticism."),
  author("schopenhauer", "Arthur Schopenhauer", 1788, 1860, "romantismo", "German", ["plato"], "The World as Will and Representation. A metaphysical pessimism that reaches Tolstoy, Nietzsche, and Machado."),
  author("balzac", "Honoré de Balzac", 1799, 1850, "romantismo", "French", ["cervantes"], "The Human Comedy: dozens of novels mapping French society after Napoleon."),
  author("hugo", "Victor Hugo", 1802, 1885, "romantismo", "French", ["shakespeare", "rousseau"], "Les Misérables and French Romanticism at full volume: social epic and militant humanity."),
  author("dumas", "Alexandre Dumas", 1802, 1870, "romantismo", "French", ["shakespeare"], "The Count of Monte Cristo and The Three Musketeers: the serial that founds modern adventure."),
  author("gogol", "Nikolai Gogol", 1809, 1852, "romantismo", "Russian", ["cervantes"], "Dead Souls: a satire of czarist Russia that opens Russian realism. Dostoevsky’s predecessor."),
  author("flaubert", "Gustave Flaubert", 1821, 1880, "realismo", "French", ["cervantes", "balzac"], "Madame Bovary founds a realism of style. A master of the sentence, and a model for Joyce and Proust."),
  author("dostoevsky", "Fyodor Dostoevsky", 1821, 1881, "realismo", "Russian", ["gogol", "schopenhauer"], "Crime and Punishment, The Brothers Karamazov: the underground, faith, and doubt at the limit.", ["crime"]),
  author("tolstoy", "Leo Tolstoy", 1828, 1910, "realismo", "Russian", ["schopenhauer", "rousseau"], "War and Peace and Anna Karenina: a realist epic of a whole society, a mind, and a soul.", ["anna"]),
  author("eca", "Eça de Queirós", 1845, 1900, "realismo", "Portuguese", ["flaubert", "balzac"], "Portuguese realism at its height: The Maias, The Crime of Father Amaro."),
  author("machado", "Machado de Assis", 1839, 1908, "realismo", "Brazilian", ["sterne", "schopenhauer", "voltaire"], "The Posthumous Memoirs and Dom Casmurro: an ironic narrator, slavery as structure, a Brazilian universality.", ["dom-casmurro"]),
  author("aluisio", "Aluísio Azevedo", 1857, 1913, "realismo", "Brazilian", ["eca"], "The Slum: a radical naturalism set in Rio after abolition."),
  author("nietzsche", "Friedrich Nietzsche", 1844, 1900, "realismo", "German", ["schopenhauer", "plato"], "Thus Spoke Zarathustra: the death of God, eternal return, a philosopher who writes like a poet."),
  author("chekhov", "Anton Chekhov", 1860, 1904, "realismo", "Russian", ["tolstoy", "gogol"], "A father of the modern story: atmosphere, subtext, a quiet turn."),
  author("proust", "Marcel Proust", 1871, 1922, "modernismo", "French", ["flaubert"], "In Search of Lost Time: involuntary memory, the stream of a mind, a novel the size of a monument."),
  author("mann", "Thomas Mann", 1875, 1955, "modernismo", "German", ["goethe", "schopenhauer"], "Buddenbrooks and The Magic Mountain: the bourgeois novel meeting the essay."),
  author("joyce", "James Joyce", 1882, 1941, "modernismo", "Irish", ["flaubert", "homer"], "Ulysses: consciousness in full flood. The Odyssey rewritten as one day in Dublin."),
  author("kafka", "Franz Kafka", 1883, 1924, "modernismo", "Czech", ["dostoevsky", "flaubert"], "The Trial and The Metamorphosis: a bureaucratic nightmare that arrives before the century’s worst offices.", ["metamorphosis"]),
  author("pessoa", "Fernando Pessoa", 1888, 1935, "modernismo", "Portuguese", ["nietzsche"], "Many heteronyms and The Book of Disquiet: a radical splitting of the self."),
  author("bulgakov", "Mikhail Bulgakov", 1891, 1940, "modernismo", "Russian", ["gogol"], "The Master and Margarita: a secret satire of Stalin’s Moscow, with the devil in town."),
  author("graciliano", "Graciliano Ramos", 1892, 1953, "modernismo", "Brazilian", ["eca", "machado"], "Barren Lives: dry prose, political, regional, and universal."),
  author("mario", "Mário de Andrade", 1893, 1945, "modernismo", "Brazilian", ["machado"], "Macunaíma and the Week of 1922: Brazilian modernism in conversation with the European vanguards."),
  author("borges", "Jorge Luis Borges", 1899, 1986, "modernismo", "Argentine", ["dante", "cervantes"], "Fictions and The Aleph: labyrinthine stories that remake the fantastic and the book about books."),
  author("saint-exupery", "Antoine de Saint-Exupéry", 1900, 1944, "modernismo", "French", ["voltaire"], "The Little Prince: a philosophical fable written from the desert and from exile."),
  author("faulkner", "William Faulkner", 1897, 1962, "modernismo", "American", ["joyce"], "The Sound and the Fury. A direct master for García Márquez and Guimarães Rosa."),
  author("camus", "Albert Camus", 1913, 1960, "contemporaneo", "French", ["dostoevsky", "kafka", "nietzsche"], "The Stranger, The Plague, The Myth of Sisyphus: the absurd, thought through after the war."),
  author("rosa", "João Guimarães Rosa", 1908, 1967, "contemporaneo", "Brazilian", ["joyce", "faulkner", "mario"], "Grande Sertão: Veredas: a total invention of language, the backlands as metaphysics."),
  author("clarice", "Clarice Lispector", 1920, 1977, "contemporaneo", "Brazilian", ["joyce", "kafka"], "The Hour of the Star and The Passion According to G.H.: the everyday made strange, syntax torn open."),
  author("marquez", "Gabriel García Márquez", 1927, 2014, "contemporaneo", "Colombian", ["faulkner", "borges", "kafka"], "One Hundred Years of Solitude: Macondo, and the Latin American magical realism that follows it."),
]

export function findCanonAuthor(id: string): CanonAuthor | undefined {
  return CANON_AUTHORS.find((item) => item.id === id)
}

export function descendantsOf(id: string): CanonAuthor[] {
  return CANON_AUTHORS.filter((item) => item.influencedBy.includes(id))
}

export function ancestralChainOf(id: string): CanonAuthor[] {
  const chain: CanonAuthor[] = []
  let current = findCanonAuthor(id)
  while (current?.mainParent) {
    const parent = findCanonAuthor(current.mainParent)
    if (!parent || chain.includes(parent)) break
    chain.push(parent)
    current = parent
  }
  return chain
}

export function allDescendantsOf(id: string): Set<string> {
  const result = new Set<string>()
  const queue = [id]
  while (queue.length) {
    const current = queue.shift()!
    for (const child of descendantsOf(current)) {
      if (result.has(child.id)) continue
      result.add(child.id)
      queue.push(child.id)
    }
  }
  return result
}
