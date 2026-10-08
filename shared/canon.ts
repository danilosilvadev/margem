/**
 * Factual shelf for pages that are not the parallel text.
 * Dates and places are the historical record. A work listed here is not a claim
 * that its text is loaded: only `textId` points at a file in `content/`.
 * Influence edges are limited to relationships the works themselves, or a
 * published translation, make explicit. See content/CANON.md.
 */

export type EraId = "ancient" | "renaissance" | "nineteenth" | "modern"

export type Author = {
  id: string
  name: string
  life: string
  birthplace: string
  /** Modern country name used by the map game. Homer has none: no birthplace is known. */
  country: string | null
  lat: number
  lon: number
  placeNote: string
  era: EraId
  bio: string
  /** When false, the person stays on the tree and off the birthplace map. */
  onMap?: boolean
}

export type Scene = {
  name: string
  detail: string
  lat?: number
  lon?: number
}

export type Work = {
  id: string
  title: string
  authorId: string
  yearLabel: string
  year: number
  genre: string
  language: string
  synopsis: string
  publicDomain: string
  /** Present only when Margem ships the reading text. */
  textId?: string
  scenes: Scene[]
  /** Other work ids a reader of this one often opens next. Editorial, not a ranking. */
  next: string[]
}

export type Influence = {
  from: string
  to: string
  note: string
}

export type Era = {
  id: EraId
  name: string
  range: string
  summary: string
  marks: string[]
  beats: string[]
}

export type SalonPrompt = { id: string; title: string; body: string }

export type Salon = {
  id: string
  name: string
  short: string
  long: string
  icon: string
  color: string
  workIds: string[]
  prompts: SalonPrompt[]
}

export type Opening = {
  id: string
  quote: string
  workId: string
  title: string
  author: string
  citation: string
}

export const ERAS: Era[] = [
  {
    id: "ancient",
    name: "Ancient Mediterranean",
    range: "8th century BCE – 19 BCE",
    summary: "Greek epic and tragedy, then a Latin epic written in their shadow.",
    marks: ["The Iliad and the Odyssey take shape as written poems", "Sophocles writes for the Athenian stage", "Virgil dies in 19 BCE with the Aeneid not yet finished, by his own account"],
    beats: [
      "The Iliad and the Odyssey come down without a reliable biography of Homer. Ancient tradition ties them to Ionia.",
      "In fifth-century Athens, Sophocles competes in the dramatic festivals. Oedipus the King is one of the seven plays of his that survive.",
      "Virgil’s Aeneid, left unfinished at his death in 19 BCE, tells the Roman founding story in the form of a Greek epic.",
    ],
  },
  {
    id: "renaissance",
    name: "From Dante to Shakespeare",
    range: "1265 – 1616",
    summary: "A Tuscan poem, a Spanish novel, and the English stage. Nothing on this shelf is dated between Virgil’s death in 19 BCE and Dante’s birth, or between 1616 and 1775.",
    marks: ["Dante dies in Ravenna in 1321", "Don Quixote, part one, is published in Madrid in 1605", "Shakespeare and Cervantes both die in 1616"],
    beats: [
      "Dante writes the Comedy in exile, in Tuscan, and puts Virgil in the poem as his guide.",
      "Cervantes publishes the first part of Don Quixote in 1605. The second part follows in 1615.",
      "Shakespeare’s plays are written for the London stage around the turn of the seventeenth century. Hamlet is among them.",
    ],
  },
  {
    id: "nineteenth",
    name: "Novels, 1775 – 1910",
    range: "1775 – 1910",
    summary: "From Austen’s birth to Tolstoy’s death. The empty years after 1616 are a gap in the shelf, not a claim that nothing was written.",
    marks: ["Pride and Prejudice, 1813", "The Raven, 1845, and Machado’s Portuguese version, 1883", "Tolstoy dies in 1910"],
    beats: [
      "Austen publishes Pride and Prejudice in 1813. Mary Shelley’s Frankenstein follows in 1818.",
      "Poe’s The Raven appears in 1845. Machado de Assis publishes a Portuguese translation in 1883, and Pérez Bonalde a Spanish one in 1887.",
      "Dostoevsky’s Crime and Punishment is serialized in 1866. Tolstoy’s Anna Karenina is published across 1875–1877.",
    ],
  },
  {
    id: "modern",
    name: "Kafka, 1883 – 1924",
    range: "1883 – 1924, one life",
    summary: "Not a century. Kafka was born in 1883, while Tolstoy was still alive, and died in 1924. The work on this shelf is the 1915 story.",
    marks: ["The Metamorphosis is published in 1915", "Kafka dies in 1924"],
    beats: [
      "Franz Kafka is born in Prague in 1883, then part of Austria-Hungary.",
      "Die Verwandlung is published in 1915.",
      "He dies in 1924. In life-plus-seventy countries the term ended in 1994. In the United States the 1915 publication is public domain.",
    ],
  },
]

export const AUTHORS: Author[] = [
  {
    id: "homer",
    name: "Homer",
    life: "traditionally 8th century BCE",
    birthplace: "No birthplace is known",
    country: null,
    lat: 38.4,
    lon: 27.1,
    placeNote: "The pin marks the Ionian coast, where ancient tradition placed the poems. It is not a documented birthplace.",
    era: "ancient",
    bio: "The name attached to the Iliad and the Odyssey. Nothing secure is known about the person. The poems are the start of the written Greek epic that later poets name.",
  },
  {
    id: "sophocles",
    name: "Sophocles",
    life: "c. 497 – c. 406 BCE",
    birthplace: "Colonus, near Athens",
    country: "Greece",
    lat: 37.98,
    lon: 23.73,
    placeNote: "Athens, where his plays were produced.",
    era: "ancient",
    bio: "Athenian tragedian. Seven of his plays survive complete, including Oedipus the King and Antigone.",
  },
  {
    id: "virgil",
    name: "Virgil",
    life: "70 – 19 BCE",
    birthplace: "Andes, near Mantua",
    country: "Italy",
    lat: 45.16,
    lon: 10.79,
    placeNote: "Mantua, the city he names as his.",
    era: "ancient",
    bio: "Publius Vergilius Maro, author of the Eclogues, the Georgics, and the Aeneid. He died at Brundisium in 19 BCE.",
  },
  {
    id: "dante",
    name: "Dante Alighieri",
    life: "1265 – 1321",
    birthplace: "Florence",
    country: "Italy",
    lat: 43.77,
    lon: 11.26,
    placeNote: "Florence. He died in exile in Ravenna.",
    era: "renaissance",
    bio: "Florentine poet. The Comedy, later called Divine, was written in exile and set in 1300. He died in Ravenna in 1321.",
  },
  {
    id: "cervantes",
    name: "Miguel de Cervantes",
    life: "1547 – 1616",
    birthplace: "Alcalá de Henares",
    country: "Spain",
    lat: 40.48,
    lon: -3.36,
    placeNote: "Alcalá de Henares. He died in Madrid.",
    era: "renaissance",
    bio: "Spanish novelist, playwright, and poet. The first part of Don Quixote was published in Madrid in 1605, the second in 1615.",
  },
  {
    id: "shakespeare",
    name: "William Shakespeare",
    life: "1564 – 1616",
    birthplace: "Stratford-upon-Avon",
    country: "England",
    lat: 52.19,
    lon: -1.71,
    placeNote: "Stratford-upon-Avon. Baptized 26 April 1564; died 23 April 1616.",
    era: "renaissance",
    bio: "English playwright and poet. His plays were written for the London companies. Hamlet belongs to the years around 1600.",
  },
  {
    id: "austen",
    name: "Jane Austen",
    life: "1775 – 1817",
    birthplace: "Steventon, Hampshire",
    country: "England",
    lat: 51.21,
    lon: -1.15,
    placeNote: "Steventon. She died in Winchester.",
    era: "nineteenth",
    bio: "English novelist. Pride and Prejudice was published in 1813. She died in Winchester in 1817.",
  },
  {
    id: "shelley",
    name: "Mary Shelley",
    life: "1797 – 1851",
    birthplace: "London",
    country: "England",
    lat: 51.51,
    lon: -0.13,
    placeNote: "London, her birthplace and the place of her death.",
    era: "nineteenth",
    bio: "English novelist. Frankenstein; or, The Modern Prometheus was published anonymously in 1818. Her name appeared on the 1823 edition.",
  },
  {
    id: "poe",
    name: "Edgar Allan Poe",
    life: "1809 – 1849",
    birthplace: "Boston",
    country: "United States",
    lat: 42.36,
    lon: -71.06,
    placeNote: "Boston, where he was born. He died in Baltimore.",
    era: "nineteenth",
    bio: "American poet, critic, and story writer. The Raven was published in 1845 in the New York Evening Mirror and collected the same year.",
  },
  {
    id: "machado",
    name: "Machado de Assis",
    life: "1839 – 1908",
    birthplace: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.91,
    lon: -43.17,
    placeNote: "Rio de Janeiro, his birthplace and the city of his death.",
    era: "nineteenth",
    bio: "Brazilian novelist, poet, and critic. His Portuguese Raven was published in 1883. Dom Casmurro was published in 1899. He died in 1908.",
  },
  {
    id: "perez-bonalde",
    name: "Juan Antonio Pérez Bonalde",
    life: "1846 – 1892",
    birthplace: "Caracas",
    country: "Venezuela",
    lat: 10.48,
    lon: -66.9,
    placeNote: "Caracas. His Spanish Raven was published in New York in 1887. He is a translator on the tree, not a pin on the birthplace map.",
    era: "nineteenth",
    onMap: false,
    bio: "Venezuelan poet. El cuervo, his translation of The Raven, appeared in 1887. He died in 1892.",
  },
  {
    id: "dostoevsky",
    name: "Fyodor Dostoevsky",
    life: "1821 – 1881",
    birthplace: "Moscow",
    country: "Russia",
    lat: 55.76,
    lon: 37.62,
    placeNote: "Moscow. He died in St. Petersburg.",
    era: "nineteenth",
    bio: "Russian novelist. Crime and Punishment was serialized in The Russian Messenger in 1866. He died in 1881.",
  },
  {
    id: "tolstoy",
    name: "Leo Tolstoy",
    life: "1828 – 1910",
    birthplace: "Yasnaya Polyana",
    country: "Russia",
    lat: 54.07,
    lon: 37.53,
    placeNote: "Yasnaya Polyana, his birthplace and estate.",
    era: "nineteenth",
    bio: "Russian novelist. Anna Karenina was published from 1875 to 1877. He died at Astapovo station in 1910.",
  },
  {
    id: "kafka",
    name: "Franz Kafka",
    life: "1883 – 1924",
    birthplace: "Prague",
    country: "Czech Republic",
    lat: 50.08,
    lon: 14.44,
    placeNote: "Prague, then in Austria-Hungary. The modern country is the Czech Republic. He died at Kierling, near Vienna.",
    era: "modern",
    bio: "German-language writer born in Prague. The Metamorphosis was published in 1915. He died in 1924.",
  },
  {
    id: "aeschylus",
    name: "Aeschylus",
    life: "c. 525 – c. 456 BCE",
    birthplace: "Eleusis",
    country: "Greece",
    lat: 38.04,
    lon: 23.54,
    placeNote: "Eleusis. On the tree only, so the Greek pins on the map stay apart.",
    era: "ancient",
    onMap: false,
    bio: "Athenian tragedian. Seven plays survive. Aristotle’s Poetics says he introduced a second actor.",
  },
  {
    id: "seneca",
    name: "Seneca",
    life: "c. 4 BCE – 65 CE",
    birthplace: "Corduba",
    country: "Spain",
    lat: 37.88,
    lon: -4.78,
    placeNote: "Corduba, now Córdoba. He died in Rome. On the tree only.",
    era: "ancient",
    onMap: false,
    bio: "Lucius Annaeus Seneca. His Latin tragedies were translated into English and collected in 1581 as Seneca His Tenne Tragedies.",
  },
  {
    id: "petrarch",
    name: "Francesco Petrarch",
    life: "1304 – 1374",
    birthplace: "Arezzo",
    country: "Italy",
    lat: 43.46,
    lon: 11.88,
    placeNote: "Arezzo. On the tree only.",
    era: "renaissance",
    onMap: false,
    bio: "Italian poet. His Latin epic Africa takes the Aeneid as its model. He was crowned poet laureate in Rome in 1341.",
  },
  {
    id: "boccaccio",
    name: "Giovanni Boccaccio",
    life: "1313 – 1375",
    birthplace: "Certaldo or Florence; the sources disagree",
    country: "Italy",
    lat: 43.55,
    lon: 11.04,
    placeNote: "Associated with Certaldo and Florence. The birthplace is disputed. On the tree only.",
    era: "renaissance",
    onMap: false,
    bio: "Author of the Decameron. In the 1350s he wrote the Trattatello in laude di Dante, a life of Dante.",
  },
  {
    id: "milton",
    name: "John Milton",
    life: "1608 – 1674",
    birthplace: "London",
    country: "England",
    lat: 51.51,
    lon: -0.12,
    placeNote: "London. On the tree only. His life sits in the gap between Shakespeare and Austen.",
    era: "renaissance",
    onMap: false,
    bio: "English poet. Paradise Lost was first published in 1667. The 1818 Frankenstein takes its epigraph from Book X.",
  },
  {
    id: "rousseau",
    name: "Jean-Jacques Rousseau",
    life: "1712 – 1778",
    birthplace: "Geneva",
    country: "Switzerland",
    lat: 46.2,
    lon: 6.14,
    placeNote: "Geneva. On the tree only.",
    era: "nineteenth",
    onMap: false,
    bio: "Writer of the Confessions and The Social Contract. Tolstoy, as a young man, wore a medallion with his portrait.",
  },
  {
    id: "goethe",
    name: "Johann Wolfgang von Goethe",
    life: "1749 – 1832",
    birthplace: "Frankfurt",
    country: "Germany",
    lat: 50.11,
    lon: 8.68,
    placeNote: "Frankfurt. On the tree only.",
    era: "nineteenth",
    onMap: false,
    bio: "German poet and novelist. He published the essay “Shakespeare und kein Ende” in 1815, and a long reading of Hamlet in Wilhelm Meister’s Apprenticeship.",
  },
  {
    id: "gogol",
    name: "Nikolai Gogol",
    life: "1809 – 1852",
    birthplace: "Velyki Sorochyntsi",
    country: "Ukraine",
    lat: 50.02,
    lon: 33.93,
    placeNote: "Velyki Sorochyntsi, then in the Russian Empire, now in Ukraine. Off the birthplace map because a modern country label would flatten that, and because the link used here is a review.",
    era: "nineteenth",
    onMap: false,
    bio: "Author of Dead Souls and The Overcoat. In 1846 the critic Vissarion Belinsky read Dostoevsky’s Poor Folk and called its author a new Gogol.",
  },
  {
    id: "dickens",
    name: "Charles Dickens",
    life: "1812 – 1870",
    birthplace: "Portsmouth",
    country: "England",
    lat: 50.8,
    lon: -1.09,
    placeNote: "Portsmouth. On the tree only, so the English birthplaces already on the map are not piled higher.",
    era: "nineteenth",
    onMap: false,
    bio: "English novelist. David Copperfield was published in 1849–50. Kafka’s diaries name it while calling Der Heizer an imitation of Dickens.",
  },
  {
    id: "baudelaire",
    name: "Charles Baudelaire",
    life: "1821 – 1867",
    birthplace: "Paris",
    country: "France",
    lat: 48.86,
    lon: 2.35,
    placeNote: "Paris. On the tree only.",
    era: "nineteenth",
    onMap: false,
    bio: "French poet. His translations of Poe, Histoires extraordinaires, were published in 1856.",
  },
]

export const WORKS: Work[] = [
  {
    id: "iliad",
    title: "The Iliad",
    authorId: "homer",
    yearLabel: "8th century BCE, traditional",
    year: -750,
    genre: "Epic",
    language: "Ancient Greek",
    synopsis: "The poem of Achilles’ anger in the ninth year of the Trojan War, ending with the ransom of Hector’s body.",
    publicDomain: "An ancient Greek poem. Every modern translation has its own copyright. Margem does not ship a translation here.",
    scenes: [{ name: "Troy", detail: "The poem’s war is at Troy, on the Hellespont.", lat: 39.96, lon: 26.24 }],
    next: ["aeneid", "oedipus"],
  },
  {
    id: "oedipus",
    title: "Oedipus the King",
    authorId: "sophocles",
    yearLabel: "c. 429 BCE",
    year: -429,
    genre: "Tragedy",
    language: "Ancient Greek",
    synopsis: "A plague is on Thebes. Oedipus, its king, looks for the man who killed Laius and finds that the search ends at himself.",
    publicDomain: "A fifth-century Athenian play. Translations are copyrighted one by one. No translation is included.",
    scenes: [{ name: "Thebes", detail: "The play is set in front of the palace at Thebes.", lat: 38.32, lon: 23.32 }],
    next: ["iliad", "hamlet"],
  },
  {
    id: "aeneid",
    title: "The Aeneid",
    authorId: "virgil",
    yearLabel: "19 BCE, unfinished",
    year: -19,
    genre: "Epic",
    language: "Latin",
    synopsis: "Aeneas leaves the fallen Troy and, after Carthage, reaches Italy. The poem was unfinished when Virgil died.",
    publicDomain: "A Latin poem of the first century BCE. Later translations are separate copyrights.",
    scenes: [
      { name: "Carthage", detail: "Books 1 and 4 are set at Dido’s Carthage.", lat: 36.85, lon: 10.32 },
      { name: "Latium", detail: "The second half brings Aeneas to the mouth of the Tiber.", lat: 41.74, lon: 12.23 },
    ],
    next: ["iliad", "comedy"],
  },
  {
    id: "comedy",
    title: "The Divine Comedy",
    authorId: "dante",
    yearLabel: "c. 1308 – 1320",
    year: 1320,
    genre: "Poem",
    language: "Tuscan Italian",
    synopsis: "A journey through Hell, Purgatory, and Paradise, dated inside the poem to Easter 1300. Virgil guides the first two parts.",
    publicDomain: "Dante died in 1321. The Italian poem is public domain. A particular English translation may not be.",
    scenes: [
      { name: "Florence", detail: "The poet’s city, named throughout, though the journey is not a map of it.", lat: 43.77, lon: 11.26 },
      { name: "Ravenna", detail: "Where Dante died in 1321, in exile.", lat: 44.42, lon: 12.2 },
    ],
    next: ["aeneid", "hamlet"],
  },
  {
    id: "quixote",
    title: "Don Quixote",
    authorId: "cervantes",
    yearLabel: "1605 and 1615",
    year: 1605,
    genre: "Novel",
    language: "Spanish",
    synopsis: "A country gentleman from La Mancha reads chivalric novels until he rides out to live inside them. Part two answers the first.",
    publicDomain: "Published in the seventeenth century. John Ormsby’s English translation of 1885 is also public domain. It is not loaded here yet.",
    scenes: [{ name: "La Mancha", detail: "The novel names La Mancha and refuses the village’s name.", lat: 39.16, lon: -3.02 }],
    next: ["hamlet", "dom-casmurro"],
  },
  {
    id: "hamlet",
    title: "Hamlet",
    authorId: "shakespeare",
    yearLabel: "about 1599 – 1601",
    year: 1601,
    genre: "Tragedy",
    language: "English",
    synopsis: "The prince of Denmark is told that his father was murdered. The court, the play within the play, and the last scene follow from that.",
    publicDomain: "Shakespeare died in 1616. The play is public domain.",
    scenes: [{ name: "Elsinore", detail: "The play is set at Elsinore, the castle of Kronborg.", lat: 56.04, lon: 12.62 }],
    next: ["oedipus", "quixote"],
  },
  {
    id: "pride",
    title: "Pride and Prejudice",
    authorId: "austen",
    yearLabel: "1813",
    year: 1813,
    genre: "Novel",
    language: "English",
    synopsis: "Elizabeth Bennet and Mr. Darcy misread each other across a year of visits, letters, and one disastrous proposal.",
    publicDomain: "Published in 1813. Austen died in 1817. The English text is public domain.",
    scenes: [{ name: "Hertfordshire", detail: "Longbourn and Netherfield are set in Hertfordshire.", lat: 51.8, lon: -0.2 }],
    next: ["frankenstein", "dom-casmurro"],
  },
  {
    id: "frankenstein",
    title: "Frankenstein",
    authorId: "shelley",
    yearLabel: "1818",
    year: 1818,
    genre: "Novel",
    language: "English",
    synopsis: "Victor Frankenstein makes a living creature in Ingolstadt and then refuses it. The story is told in letters from the Arctic and in Victor’s own account.",
    publicDomain: "The 1818 text was published in London. Mary Shelley died in 1851.",
    scenes: [
      { name: "Geneva", detail: "The Frankenstein family house is at Geneva.", lat: 46.2, lon: 6.14 },
      { name: "Ingolstadt", detail: "Victor studies, and builds the creature, at the university in Ingolstadt.", lat: 48.76, lon: 11.42 },
    ],
    next: ["pride", "the-raven"],
  },
  {
    id: "the-raven",
    title: "The Raven",
    authorId: "poe",
    yearLabel: "1845",
    year: 1845,
    genre: "Poem",
    language: "English",
    synopsis: "A speaker at midnight answers a tapping and lets in a raven whose only word is Nevermore. Margem reads it beside Machado’s Portuguese and Pérez Bonalde’s Spanish.",
    publicDomain: "Poe died in 1849. The 1845 text is public domain. Machado died in 1908 and Pérez Bonalde in 1892, so those translations are as well.",
    textId: "the-raven",
    scenes: [
      { name: "The chamber", detail: "The poem names a chamber, a door, and a bust of Pallas. It does not name a city." },
    ],
    next: ["frankenstein", "dom-casmurro"],
  },
  {
    id: "dom-casmurro",
    title: "Dom Casmurro",
    authorId: "machado",
    yearLabel: "1899",
    year: 1899,
    genre: "Novel",
    language: "Portuguese",
    synopsis: "Bento Santiago, writing in old age, tries to reconstruct his youth with Capitu and whether she betrayed him. The book does not settle it for him.",
    publicDomain: "Published in Rio in 1899. Machado died in 1908, so life-plus-seventy has long expired, including in Brazil.",
    scenes: [{ name: "Rio de Janeiro", detail: "The remembered streets, the beach at Glória, and the later house in Engenho Novo are in Rio.", lat: -22.91, lon: -43.17 }],
    next: ["the-raven", "crime"],
  },
  {
    id: "crime",
    title: "Crime and Punishment",
    authorId: "dostoevsky",
    yearLabel: "1866",
    year: 1866,
    genre: "Novel",
    language: "Russian",
    synopsis: "Raskolnikov, a former student in St. Petersburg, kills a pawnbroker and then lives inside the consequence. The novel was serialized in 1866.",
    publicDomain: "Dostoevsky died in 1881. The Russian text is public domain. An English translation is public domain only when that translation is, for example Constance Garnett’s.",
    scenes: [{ name: "St. Petersburg", detail: "The murders, the room, and the investigation are in St. Petersburg.", lat: 59.93, lon: 30.36 }],
    next: ["anna", "the-raven"],
  },
  {
    id: "anna",
    title: "Anna Karenina",
    authorId: "tolstoy",
    yearLabel: "1875 – 1877",
    year: 1877,
    genre: "Novel",
    language: "Russian",
    synopsis: "Anna leaves her marriage for Vronsky. In parallel, Levin farms, courts Kitty, and argues with himself about how to live. Published 1875–1877.",
    publicDomain: "Tolstoy died in 1910. The Russian text is public domain. Constance Garnett’s 1901 English translation is public domain in the United States because it was published before 1930.",
    scenes: [
      { name: "Moscow", detail: "The Oblonsky household and much of the social plot are in Moscow.", lat: 55.76, lon: 37.62 },
      { name: "Yasnaya Polyana", detail: "Levin’s estate draws on the country life Tolstoy knew. The novel does not name Yasnaya Polyana.", lat: 54.07, lon: 37.53 },
    ],
    next: ["crime", "metamorphosis"],
  },
  {
    id: "metamorphosis",
    title: "The Metamorphosis",
    authorId: "kafka",
    yearLabel: "1915",
    year: 1915,
    genre: "Story",
    language: "German",
    synopsis: "Gregor Samsa wakes as an insect and then loses, room by room, his job, his family, and the space they are willing to give him.",
    publicDomain: "Published in 1915. Kafka died in 1924. The German text is public domain. A given English translation still needs its own check.",
    scenes: [{ name: "The Samsa flat", detail: "The story names a flat, a bedroom door, and an office. It does not name Prague." }],
    next: ["anna", "the-raven"],
  },
]

export const INFLUENCES: Influence[] = [
  {
    from: "homer",
    to: "virgil",
    note: "The Aeneid is a Latin epic of war and wandering built on the Iliad and the Odyssey. Virgil has Aeneas leave Troy.",
  },
  {
    from: "aeschylus",
    to: "sophocles",
    note: "Aristotle’s Poetics (1449a) says Aeschylus introduced a second actor and Sophocles raised the number to three.",
  },
  {
    from: "virgil",
    to: "dante",
    note: "In the Comedy, Dante makes Virgil his guide through Hell and Purgatory, and addresses him as master.",
  },
  {
    from: "virgil",
    to: "petrarch",
    note: "Petrarch’s Latin epic Africa takes the Aeneid as its model. He was crowned poet laureate in Rome in 1341 for it.",
  },
  {
    from: "dante",
    to: "boccaccio",
    note: "Boccaccio wrote the Trattatello in laude di Dante, a life of Dante, in the 1350s.",
  },
  {
    from: "seneca",
    to: "shakespeare",
    note: "Seneca’s tragedies were collected in English in 1581 as Seneca His Tenne Tragedies. Titus Andronicus uses that revenge-tragedy form.",
  },
  {
    from: "shakespeare",
    to: "goethe",
    note: "Goethe published “Shakespeare und kein Ende” in 1815, and Wilhelm Meister’s Apprenticeship contains a long reading of Hamlet.",
  },
  {
    from: "milton",
    to: "shelley",
    note: "The 1818 Frankenstein prints an epigraph from Paradise Lost, Book X: the creature’s question to his maker.",
  },
  {
    from: "poe",
    to: "baudelaire",
    note: "Baudelaire’s translations of Poe, Histoires extraordinaires, were published in 1856.",
  },
  {
    from: "poe",
    to: "machado",
    note: "Machado published his Portuguese translation of The Raven in 1883. That is a document, not a guess about taste.",
  },
  {
    from: "poe",
    to: "perez-bonalde",
    note: "Pérez Bonalde published El cuervo, his Spanish translation of The Raven, in New York in 1887.",
  },
  {
    from: "gogol",
    to: "dostoevsky",
    note: "In 1846 Vissarion Belinsky read Poor Folk and described the young Dostoevsky as a new Gogol.",
  },
  {
    from: "rousseau",
    to: "tolstoy",
    note: "As a young man Tolstoy wore a medallion portrait of Rousseau, and he later named Rousseau among the writers who formed him.",
  },
  {
    from: "dickens",
    to: "kafka",
    note: "In his diaries Kafka calls Der Heizer a straight imitation of Dickens and names David Copperfield.",
  },
]

export const SALONS: Salon[] = [
  {
    id: "midnight",
    name: "Midnight salon",
    short: "Poe, Shelley, and the room after dark",
    long: "A standing room for the night pieces: a raven that says one word, and a creature made and then refused. No curator is invented here. The prompts are questions, and the threads are whatever readers sign.",
    icon: "☾",
    color: "#4d1925",
    workIds: ["the-raven", "frankenstein"],
    prompts: [
      {
        id: "midnight-word",
        title: "Why is the bird’s whole speech one word?",
        body: "The Raven gives the visitor a single word and spends the poem letting the speaker supply the rest. Is the cruelty in the bird, or in the questions?",
      },
      {
        id: "midnight-made",
        title: "Frankenstein refuses what he made",
        body: "The 1818 novel turns on a maker who will not look at his work. Where, in the book, does that refusal become the plot rather than a mood?",
      },
    ],
  },
  {
    id: "ancient",
    name: "Ancient salon",
    short: "Homer, Sophocles, Virgil",
    long: "Epic and tragedy before the novel. The room stays with three works whose texts are old enough that the copyright question is about translations, not about the poems.",
    icon: "Α",
    color: "#6b4a2a",
    workIds: ["iliad", "oedipus", "aeneid"],
    prompts: [
      {
        id: "ancient-guide",
        title: "What does Virgil keep from Homer, and what does he change?",
        body: "Aeneas leaves Troy. The war is behind him and also ahead of him. Which scenes are doing Homer’s work, and which are Roman?",
      },
    ],
  },
  {
    id: "iberian",
    name: "Iberian and Brazilian salon",
    short: "Cervantes and Machado",
    long: "Two prose writers in two centuries of Portuguese and Spanish. Don Quixote sends a reader out of his library. Dom Casmurro writes from inside a house he built to resemble an old one.",
    icon: "¶",
    color: "#7a3412",
    workIds: ["quixote", "dom-casmurro", "the-raven"],
    prompts: [
      {
        id: "iberian-library",
        title: "Both men are ruined, or saved, by reading",
        body: "Quixote’s library is burned. Bento Santiago writes a book to prove a case. What does each novel think a book can do to a person?",
      },
    ],
  },
  {
    id: "russian",
    name: "Russian salon",
    short: "Dostoevsky and Tolstoy",
    long: "Two novels of the 1860s and 1870s. Crime and Punishment stays in rented rooms in Petersburg. Anna Karenina moves between a marriage, a love affair, and Levin’s fields.",
    icon: "Я",
    color: "#1f3d5c",
    workIds: ["crime", "anna"],
    prompts: [
      {
        id: "russian-two",
        title: "Two ways of leaving a room",
        body: "Raskolnikov walks out to commit a murder he has already argued. Anna walks out of a marriage the book has already made airless. What does each novel do with the idea of a reason?",
      },
    ],
  },
]

export const OPENINGS: Opening[] = [
  {
    id: "raven-open",
    quote: "Once upon a midnight dreary, while I pondered, weak and weary",
    workId: "the-raven",
    title: "The Raven",
    author: "Edgar Allan Poe",
    citation: "Edgar Allan Poe, The Raven, 1845. The line is in the text Margem ships.",
  },
  {
    id: "austen-open",
    quote: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    workId: "pride",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    citation: "Jane Austen, Pride and Prejudice, 1813, first sentence.",
  },
  {
    id: "melville-open",
    quote: "Call me Ishmael.",
    workId: "moby-dick",
    title: "Moby-Dick",
    author: "Herman Melville",
    citation: "Herman Melville, Moby-Dick, 1851, first sentence. Melville lived 1819–1891. The novel is not otherwise on this shelf.",
  },
  {
    id: "ormsby-open",
    quote: "In a village of La Mancha, the name of which I have no desire to call to mind",
    workId: "quixote",
    title: "Don Quixote",
    author: "Miguel de Cervantes",
    citation: "Miguel de Cervantes, Don Quixote, part one, 1605, in John Ormsby’s English translation of 1885. Ormsby lived 1829–1895.",
  },
  {
    id: "garnett-open",
    quote: "Happy families are all alike; every unhappy family is unhappy in its own way.",
    workId: "anna",
    title: "Anna Karenina",
    author: "Leo Tolstoy",
    citation: "Leo Tolstoy, Anna Karenina, in Constance Garnett’s English translation of 1901. Garnett lived 1861–1946. The 1901 book was published before 1930.",
  },
  {
    id: "carol-open",
    quote: "Marley was dead: to begin with.",
    workId: "christmas-carol",
    title: "A Christmas Carol",
    author: "Charles Dickens",
    citation: "Charles Dickens, A Christmas Carol, 1843, first sentence. Dickens lived 1812–1870.",
  },
  {
    id: "eyre-open",
    quote: "There was no possibility of taking a walk that day.",
    workId: "jane-eyre",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    citation: "Charlotte Brontë, Jane Eyre, 1847, first sentence. She died in 1855.",
  },
  {
    id: "cities-open",
    quote: "It was the best of times, it was the worst of times",
    workId: "two-cities",
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    citation: "Charles Dickens, A Tale of Two Cities, 1859, opening clause.",
  },
  {
    id: "alice-open",
    quote: "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do",
    workId: "alice",
    title: "Alice’s Adventures in Wonderland",
    author: "Lewis Carroll",
    citation: "Lewis Carroll, Alice’s Adventures in Wonderland, 1865, first sentence. Carroll (Charles Dodgson) died in 1898.",
  },
  {
    id: "frank-open",
    quote: "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.",
    workId: "frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    citation: "Mary Shelley, Frankenstein, 1818, the first sentence of Robert Walton’s first letter.",
  },
  {
    id: "dracula-open",
    quote: "Left Munich at 8:35 P.M., on 1st May, arriving at Vienna early next morning",
    workId: "dracula",
    title: "Dracula",
    author: "Bram Stoker",
    citation: "Bram Stoker, Dracula, 1897, from Jonathan Harker’s first journal entry. Stoker died in 1912.",
  },
  {
    id: "dorian-open",
    quote: "The studio was filled with the rich odour of roses, and when the light summer wind stirred amongst the trees of the garden",
    workId: "dorian",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    citation: "Oscar Wilde, The Picture of Dorian Gray, 1891 book edition, opening. Wilde died in 1900.",
  },
  {
    id: "heart-open",
    quote: "The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest.",
    workId: "heart-of-darkness",
    title: "Heart of Darkness",
    author: "Joseph Conrad",
    citation: "Joseph Conrad, Heart of Darkness, 1899, first sentence. Conrad died in 1924.",
  },
  {
    id: "kafka-open",
    quote: "Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt.",
    workId: "metamorphosis",
    title: "The Metamorphosis",
    author: "Franz Kafka",
    citation: "Franz Kafka, Die Verwandlung, 1915, the German first sentence. This is Kafka’s own wording, not an English translation.",
  },
]

export function authorById(id: string): Author | undefined {
  return AUTHORS.find((author) => author.id === id)
}

export function workById(id: string): Work | undefined {
  return WORKS.find((work) => work.id === id)
}

export function worksByAuthor(authorId: string): Work[] {
  return WORKS.filter((work) => work.authorId === authorId)
}

export function salonById(id: string): Salon | undefined {
  return SALONS.find((salon) => salon.id === id)
}
