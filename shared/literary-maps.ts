/** Literary map collections. Ported from O Cenáculo and translated.
 * Each collection filters the shelf and chooses how the atlas is drawn.
 */

export type ProjectionConfig = {
  scale: number
  center: [number, number]
}

export type Region = {
  id: string
  name: string
  center: [number, number]
  authors: string[]
}

export type AtlasBook = {
  author_name?: string | null
  nationality?: string | null
  genre?: string | null
  publication_year?: number | null
}

export type MapCollection = {
  id: string
  name: string
  description: string
  legend?: string
  emoji: string
  filter: (book: AtlasBook) => boolean
  projection: ProjectionConfig
  variant?: "pins" | "world-cover" | "region-cover"
  regions?: Region[]
  countryFilter?: (geoName: string) => boolean
}

const CONTINENT: Record<string, string> = {
  Brazilian: "americas",
  Colombian: "americas",
  American: "americas",
  Argentine: "americas",
  French: "europe",
  Italian: "europe",
  Portuguese: "europe",
  Spanish: "europe",
  German: "europe",
  Russian: "europe",
  Czech: "europe",
  Greek: "europe",
  Roman: "europe",
  English: "europe",
  British: "europe",
  Irish: "europe",
  Japanese: "asia",
  Chinese: "asia",
  Arab: "asia",
}

export const CONTINENTS: MapCollection[] = [
  {
    id: "europa",
    name: "Europe",
    description: "The ground of the modern classics, from Cervantes to Dostoevsky",
    legend: "Each flag marks an author’s country. Open one to see the European works on this shelf, most-read first.",
    emoji: "🏰",
    filter: (book) => !!book.nationality && CONTINENT[book.nationality] === "europe",
    projection: { scale: 700, center: [15, 52] },
  },
  {
    id: "americas",
    name: "Americas",
    description: "Literature of the New World, from Brazil outward",
    legend: "A continent of the regional novel and modern prose. Open a flag to see the American works on this shelf.",
    emoji: "🌎",
    filter: (book) => !!book.nationality && CONTINENT[book.nationality] === "americas",
    projection: { scale: 320, center: [-65, -10] },
  },
  {
    id: "asia",
    name: "Asia & the Middle East",
    description: "The Thousand and One Nights, and the long wisdom of the East",
    legend: "From Arabic poetry to Japanese prose: the East that shaped stories for millennia.",
    emoji: "🏯",
    filter: (book) => !!book.nationality && CONTINENT[book.nationality] === "asia",
    projection: { scale: 380, center: [85, 30] },
  },
  {
    id: "mediterraneo",
    name: "Ancient Mediterranean",
    description: "Greece, Rome, and the birth of Western literature",
    legend: "The founding cut: poets, philosophers, and dramatists who still say who we are. Greece, Rome, and Renaissance Italy on one sea.",
    emoji: "🏛️",
    filter: (book) => book.nationality === "Greek" || book.nationality === "Roman" || book.nationality === "Italian",
    projection: { scale: 900, center: [18, 39] },
  },
]

export const MAP_ERAS: MapCollection[] = [
  {
    id: "antiguidade",
    name: "Classical Antiquity",
    description: "Before the year 500: Homer, Sophocles, Plato",
    legend: "Works born before the Christian centuries. Philosophy, tragedy, and epic that still set the measure.",
    emoji: "⚱️",
    filter: (book) => book.publication_year != null && book.publication_year < 500,
    projection: { scale: 600, center: [25, 38] },
  },
  {
    id: "medievo-renascimento",
    name: "Middle Ages & Renaissance",
    description: "Between 500 and 1700: Dante, Cervantes, Machiavelli",
    legend: "From the Comedy to the modern novel: the centuries in which Europe remade the hero, faith, and the state.",
    emoji: "📜",
    filter: (book) => book.publication_year != null && book.publication_year >= 500 && book.publication_year < 1700,
    projection: { scale: 600, center: [10, 45] },
  },
  {
    id: "seculo-19",
    name: "Nineteenth century",
    description: "The great age of the novel: Tolstoy, Flaubert, Machado",
    legend: "A hundred years in which the novel became the dominant way of thinking about a society.",
    emoji: "🎩",
    filter: (book) => book.publication_year != null && book.publication_year >= 1800 && book.publication_year < 1900,
    projection: { scale: 280, center: [-20, 35] },
  },
  {
    id: "seculo-20",
    name: "Twentieth century",
    description: "Modern literature: Kafka and what follows him",
    legend: "The century of the break: stream of consciousness, the absurd, and a novel that no longer trusts its own form.",
    emoji: "✒️",
    filter: (book) => book.publication_year != null && book.publication_year >= 1900,
    projection: { scale: 200, center: [-30, 25] },
  },
]

function inRange(year: number | null | undefined, min: number, max: number): boolean {
  return year != null && year >= min && year <= max
}

const novelish = (genre: string | null | undefined) => genre === "Novel" || genre === "Story"

export const SCHOOLS: MapCollection[] = [
  {
    id: "tragedia-grega",
    name: "Greek tragedy",
    description: "Sophocles, Euripides, and the classical stage",
    legend: "Theater as a shared rite: fate, hubris, and the fall. Fifth century BCE, almost all of it born in Athens.",
    emoji: "🎭",
    filter: (book) => book.genre === "Tragedy" && book.nationality === "Greek",
    projection: { scale: 1400, center: [23, 38] },
  },
  {
    id: "filosofia-classica",
    name: "Classical & Stoic philosophy",
    description: "From Plato to Marcus Aurelius: an art of living",
    legend: "The old manuals of how to live: Athens, Rome, and a Stoicism that crosses centuries.",
    emoji: "🏛️",
    filter: (book) => book.genre === "Philosophy" && (book.publication_year ?? 9999) < 1500,
    projection: { scale: 600, center: [20, 40] },
  },
  {
    id: "realismo",
    name: "Realism & Naturalism",
    description: "The nineteenth century: Flaubert, Machado, Dostoevsky",
    legend: "Prose as a lens on bourgeois life, the province, and the underground of the soul. 1830–1900.",
    emoji: "🖋️",
    filter: (book) => inRange(book.publication_year, 1830, 1900) && novelish(book.genre),
    projection: { scale: 350, center: [10, 45] },
  },
  {
    id: "modernismo",
    name: "Modernism",
    description: "Kafka, Proust, Joyce: the break at the start of the twentieth century",
    legend: "Time dissolves and consciousness becomes the material. Prague, Paris, Dublin: the novel reinvents itself.",
    emoji: "🌀",
    filter: (book) => inRange(book.publication_year, 1900, 1945),
    projection: { scale: 350, center: [5, 40] },
  },
  {
    id: "existencialismo",
    name: "Existentialism",
    description: "Camus, Kafka: the absurd and the human condition",
    legend: "Postwar Europe: freedom, nausea, and the question of meaning. France and Bohemia on the axis.",
    emoji: "🚪",
    filter: (book) => inRange(book.publication_year, 1900, 1970) && (book.nationality === "French" || book.nationality === "Czech"),
    projection: { scale: 700, center: [8, 48] },
  },
  {
    id: "realismo-magico",
    name: "Magical realism",
    description: "García Márquez and Latin American fiction",
    legend: "A Latin America where the real and the supernatural walk together. Macondo is somewhere on the map.",
    emoji: "🦋",
    filter: (book) => inRange(book.publication_year, 1950, 2000) && (book.nationality === "Colombian" || book.nationality === "Brazilian"),
    projection: { scale: 400, center: [-65, -5] },
  },
]

export const GENRES: MapCollection[] = [
  {
    id: "romance",
    name: "Novel",
    description: "The long story in prose",
    legend: "The dominant literary form of the last three centuries: long, ambiguous, able to hold a whole life.",
    emoji: "📖",
    filter: (book) => book.genre === "Novel",
    projection: { scale: 200, center: [0, 35] },
  },
  {
    id: "filosofia",
    name: "Philosophy",
    description: "Thought that crosses centuries",
    legend: "From the Republic to the genealogists of morals: ideas that structure what we think without noticing.",
    emoji: "💭",
    filter: (book) => book.genre === "Philosophy",
    projection: { scale: 200, center: [10, 40] },
  },
  {
    id: "tragedia",
    name: "Tragedy & drama",
    description: "The stage as a mirror of the soul",
    legend: "The old stage and the modern one, where a human conflict is played at full compression.",
    emoji: "🎭",
    filter: (book) => book.genre === "Tragedy",
    projection: { scale: 600, center: [15, 40] },
  },
  {
    id: "poesia",
    name: "Poetry & epic",
    description: "From the Iliad to the Divine Comedy",
    legend: "Verse that founds cultures: the oldest and most condensed literary form.",
    emoji: "🪶",
    filter: (book) => book.genre === "Poem" || book.genre === "Epic",
    projection: { scale: 400, center: [15, 40] },
  },
  {
    id: "contos",
    name: "Stories & fables",
    description: "The art of the short narrative",
    legend: "The power of a short plot, from ancient oral tales to modern collections.",
    emoji: "🌙",
    filter: (book) => book.genre === "Story",
    projection: { scale: 250, center: [30, 30] },
  },
]

const BRAZIL: Region[] = [
  { id: "norte", name: "North", center: [-60, -3.5], authors: [] },
  { id: "nordeste", name: "Northeast", center: [-39, -9], authors: ["Graciliano Ramos", "Aluísio Azevedo", "Clarice Lispector", "Jorge Amado", "João Cabral de Melo Neto", "Rachel de Queiroz", "José Lins do Rego"] },
  { id: "centro-oeste", name: "Central-West", center: [-52, -15], authors: [] },
  { id: "sudeste", name: "Southeast", center: [-44, -20], authors: ["Machado de Assis", "Guimarães Rosa", "Mário de Andrade", "Carlos Drummond de Andrade", "Cecília Meireles", "Manuel Bandeira"] },
  { id: "sul", name: "South", center: [-52, -28], authors: ["Erico Verissimo", "Cruz e Sousa", "Mario Quintana"] },
]

const RUSSIA: Region[] = [
  { id: "noroeste", name: "Northwest (St. Petersburg)", center: [30.3, 59.9], authors: ["Fyodor Dostoevsky"] },
  { id: "central", name: "Central (Moscow & Tula)", center: [37, 55.7], authors: ["Leo Tolstoy", "Mikhail Bulgakov", "Anton Chekhov", "Boris Pasternak"] },
  { id: "sul", name: "South (Ukraine & the Caucasus)", center: [35, 48], authors: ["Nikolai Gogol"] },
  { id: "volga", name: "Volga", center: [49, 55], authors: [] },
  { id: "siberia", name: "Siberia", center: [85, 60], authors: [] },
  { id: "extremo-oriente", name: "Far East", center: [135, 50], authors: [] },
]

const FRANCE: Region[] = [
  { id: "ile-de-france", name: "Île-de-France (Paris)", center: [2.35, 48.85], authors: ["Marcel Proust", "Victor Hugo", "Honoré de Balzac", "Émile Zola", "Voltaire", "Charles Baudelaire"] },
  { id: "normandie", name: "Normandy", center: [0.4, 49.1], authors: ["Gustave Flaubert", "Guy de Maupassant"] },
  { id: "provence", name: "Provence", center: [5.4, 43.7], authors: ["Alphonse Daudet", "Marcel Pagnol"] },
  { id: "auvergne-rhone", name: "Auvergne-Rhône-Alpes", center: [4.8, 45.7], authors: ["Antoine de Saint-Exupéry", "Stendhal"] },
  { id: "bourgogne", name: "Bourgogne-Franche-Comté", center: [5, 47.3], authors: [] },
  { id: "aquitaine", name: "Nouvelle-Aquitaine", center: [-0.6, 45], authors: ["Michel de Montaigne", "François Mauriac"] },
  { id: "alsace", name: "Alsace", center: [7.7, 48.6], authors: [] },
  { id: "africa-do-norte", name: "North Africa (colonial)", center: [3, 36.7], authors: ["Albert Camus", "Alexandre Dumas"] },
]

const SPAIN: Region[] = [
  { id: "castela-mancha", name: "Castile-La Mancha", center: [-3.7, 39.5], authors: ["Miguel de Cervantes"] },
  { id: "madrid", name: "Madrid", center: [-3.7, 40.4], authors: ["Benito Pérez Galdós"] },
  { id: "andaluzia", name: "Andalusia", center: [-4.5, 37.3], authors: ["Federico García Lorca", "Antonio Machado"] },
  { id: "catalunha", name: "Catalonia", center: [1.8, 41.7], authors: ["Mercè Rodoreda"] },
  { id: "galicia", name: "Galicia", center: [-8, 42.8], authors: ["Rosalía de Castro"] },
  { id: "pais-basco", name: "Basque Country", center: [-2.7, 43], authors: [] },
]

const ITALY: Region[] = [
  { id: "toscana", name: "Tuscany", center: [11.3, 43.8], authors: ["Dante Alighieri", "Niccolò Machiavelli", "Giovanni Boccaccio", "Francesco Petrarch"] },
  { id: "lazio", name: "Lazio (Rome)", center: [12.5, 41.9], authors: ["Marcus Aurelius", "Cicero", "Virgil"] },
  { id: "lombardia", name: "Lombardy", center: [9.2, 45.5], authors: ["Alessandro Manzoni"] },
  { id: "sicilia", name: "Sicily", center: [14, 37.6], authors: ["Giuseppe Tomasi di Lampedusa", "Luigi Pirandello"] },
  { id: "veneto", name: "Veneto", center: [12, 45.4], authors: ["Carlo Goldoni"] },
  { id: "piemonte", name: "Piedmont", center: [7.7, 45], authors: ["Cesare Pavese", "Italo Calvino", "Primo Levi"] },
]

const GREECE: Region[] = [
  { id: "atica", name: "Attica (Athens)", center: [23.7, 38], authors: ["Plato", "Sophocles", "Euripides", "Aristophanes", "Thucydides"] },
  { id: "macedonia", name: "Macedonia", center: [22.5, 40.6], authors: ["Aristotle"] },
  { id: "peloponeso", name: "Peloponnese", center: [22.3, 37.5], authors: [] },
  { id: "ilhas-egeu", name: "Aegean & Ionia", center: [25.5, 37.5], authors: ["Homer", "Sappho", "Herodotus"] },
  { id: "creta", name: "Crete", center: [25, 35.2], authors: ["Nikos Kazantzakis"] },
]

const USA: Region[] = [
  { id: "northeast", name: "Northeast", center: [-74, 41], authors: ["Edgar Allan Poe", "Herman Melville", "Walt Whitman", "Emily Dickinson"] },
  { id: "midwest", name: "Midwest", center: [-90, 41], authors: ["Mark Twain", "Ernest Hemingway"] },
  { id: "south", name: "South", center: [-86, 33], authors: ["William Faulkner", "Flannery O'Connor"] },
  { id: "west", name: "West", center: [-115, 38], authors: ["John Steinbeck", "Jack London"] },
]

const BRITAIN: Region[] = [
  { id: "london", name: "London", center: [-0.13, 51.5], authors: ["Charles Dickens", "Virginia Woolf", "Oscar Wilde", "Mary Shelley"] },
  { id: "south-east", name: "South (Hampshire)", center: [-1.1, 51], authors: ["Jane Austen", "Lewis Carroll"] },
  { id: "south-west", name: "Southwest (Wessex)", center: [-3.2, 50.9], authors: ["Thomas Hardy"] },
  { id: "midlands", name: "Midlands", center: [-1.5, 52.5], authors: ["William Shakespeare", "George Eliot"] },
  { id: "north", name: "North (Yorkshire)", center: [-1.5, 54], authors: ["Emily Brontë", "Charlotte Brontë"] },
  { id: "scotland", name: "Scotland", center: [-4.2, 56.5], authors: ["Robert Louis Stevenson", "Walter Scott"] },
  { id: "ireland", name: "Ireland", center: [-8, 53.4], authors: ["James Joyce", "Bram Stoker", "Jonathan Swift"] },
]

export const SPECIALS: MapCollection[] = [
  {
    id: "mundi-literario",
    name: "World literary map",
    description: "Each country painted with the cover of its most-read book: the shelf as one atlas",
    legend: "Each territory takes the cover of the most-read work from there. A country with no color has no book on this shelf yet. Click to open it.",
    emoji: "🗺️",
    filter: () => true,
    projection: { scale: 175, center: [10, 15] },
    variant: "world-cover",
  },
  {
    id: "brasil-regioes",
    name: "Brazil by region",
    description: "North, Northeast, Central-West, Southeast, and South, each with the book of its literary ground",
    legend: "Authors are tied to the region they came from. The cover is the most-read work from that part of the country.",
    emoji: "🇧🇷",
    filter: (book) => book.nationality === "Brazilian",
    projection: { scale: 700, center: [-52, -14] },
    variant: "region-cover",
    regions: BRAZIL,
    countryFilter: (name) => name === "Brazil",
  },
  {
    id: "russia-regioes",
    name: "Russia by region",
    description: "St. Petersburg, Moscow, the South, Siberia: Russian literature by the geography that shaped it",
    legend: "Dostoevsky in Petersburg’s north, Tolstoy in the central country, Gogol from the south. Empty regions are still waiting.",
    emoji: "🇷🇺",
    filter: (book) => book.nationality === "Russian",
    projection: { scale: 320, center: [70, 60] },
    variant: "region-cover",
    regions: RUSSIA,
    countryFilter: (name) => name === "Russia",
  },
  {
    id: "franca-regioes",
    name: "France by region",
    description: "Paris, Normandy, Provence, and beyond: the geography of French prose",
    legend: "Each region shows the author most tied to it and the most-read book. North Africa is the colonial Algeria where Camus was born.",
    emoji: "🇫🇷",
    filter: (book) => book.nationality === "French",
    projection: { scale: 1500, center: [3, 47] },
    variant: "region-cover",
    regions: FRANCE,
    countryFilter: (name) => name === "France",
  },
  {
    id: "espanha-regioes",
    name: "Spain by region",
    description: "From Castile-La Mancha to Lorca’s country: the map of Iberian literature",
    legend: "Cervantes was born in Castile-La Mancha. Other regions wait for more works on this shelf.",
    emoji: "🇪🇸",
    filter: (book) => book.nationality === "Spanish",
    projection: { scale: 1400, center: [-3.5, 40] },
    variant: "region-cover",
    regions: SPAIN,
    countryFilter: (name) => name === "Spain",
  },
  {
    id: "italia-regioes",
    name: "Italy by region",
    description: "Tuscany, Lazio, Sicily: the map from Dante to Calvino",
    legend: "Tuscany is the heart: Dante and Machiavelli were born a short ride apart. Lazio keeps ancient Rome.",
    emoji: "🇮🇹",
    filter: (book) => book.nationality === "Italian" || book.nationality === "Roman",
    projection: { scale: 1500, center: [12.5, 42.5] },
    variant: "region-cover",
    regions: ITALY,
    countryFilter: (name) => name === "Italy",
  },
  {
    id: "grecia-regioes",
    name: "Greece by region",
    description: "Attica, Macedonia, the islands: the regional cradle of Western literature",
    legend: "Athens gathered tragedy and philosophy. Aristotle came from the Macedonian north. Homer is placed in the Ionian islands.",
    emoji: "🇬🇷",
    filter: (book) => book.nationality === "Greek",
    projection: { scale: 2200, center: [23, 38] },
    variant: "region-cover",
    regions: GREECE,
    countryFilter: (name) => name === "Greece",
  },
  {
    id: "eua-regioes",
    name: "United States by region",
    description: "Northeast, Midwest, South, and West: American literature on its own map",
    legend: "Faulkner is the South, Hemingway the Midwest, Poe the Northeast. Each region has its own literary accent.",
    emoji: "🇺🇸",
    filter: (book) => book.nationality === "American",
    projection: { scale: 600, center: [-97, 39] },
    variant: "region-cover",
    regions: USA,
    countryFilter: (name) => name === "United States of America",
  },
  {
    id: "inglaterra-regioes",
    name: "Britain & Ireland by region",
    description: "London, Yorkshire, Scotland, Ireland: island literature on the map",
    legend: "Shakespeare is the Midlands, Austen the South, Joyce is Dublin. The island canon is spread across the whole map.",
    emoji: "🇬🇧",
    filter: (book) => book.nationality === "English" || book.nationality === "British" || book.nationality === "Irish",
    projection: { scale: 1400, center: [-3, 54] },
    variant: "region-cover",
    regions: BRITAIN,
    countryFilter: (name) => name === "United Kingdom" || name === "Ireland",
  },
]

export const MAP_SECTIONS: { title: string; description: string; collections: MapCollection[] }[] = [
  { title: "Specials", description: "Single, curated views of the shelf", collections: SPECIALS },
  { title: "By Continent", description: "Travel the regions that shaped the world’s literature", collections: CONTINENTS },
  { title: "By Era", description: "Cross the centuries, from antiquity to modernism", collections: MAP_ERAS },
  { title: "By Literary School", description: "The movements that defined each age", collections: SCHOOLS },
  { title: "By Genre", description: "Thematic cuts of the shelf", collections: GENRES },
]
