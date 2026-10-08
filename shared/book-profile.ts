/**
 * Editorial cards for the book profile. Places and dates are the historical record.
 * Quotations are the original wording, or a named public-domain translation.
 * A modern translation is not quoted.
 */

export type ProfilePlace = {
  name: string
  description: string
  /** Longitude, then latitude. Omitted for a place the book does not locate. */
  lon?: number
  lat?: number
  passage?: string
  imagined?: boolean
}

export type ProfileQuote = {
  text: string
  cite: string
}

export type BookProfile = {
  placesKind: "real" | "imagined" | "mixed"
  places: ProfilePlace[]
  context: string
  themes: string[]
  characters: { name: string; note: string }[]
  quotes: ProfileQuote[]
  timeline: { label: string; detail: string }[]
}

export const BOOK_PROFILES: Record<string, BookProfile> = {
  iliad: {
    placesKind: "real",
    places: [
      {
        name: "Troy",
        description: "The war of the poem is fought at Troy, on the Hellespont. The Greek camp is on the shore below the city.",
        lon: 26.24,
        lat: 39.96,
        passage: "The poem",
      },
    ],
    context:
      "The Iliad is an ancient Greek epic, traditionally placed in the eighth century BCE, about the anger of Achilles in the ninth year of the Trojan War. It ends with Priam ransoming Hector’s body. Nothing secure is known about Homer. Later epics, including Virgil’s, take this poem as a starting point.",
    themes: ["Achilles’ anger", "Glory and the short life", "The ransom of the dead", "Gods who take sides"],
    characters: [
      { name: "Achilles", note: "The poem opens on his anger and his withdrawal from the fighting." },
      { name: "Hector", note: "Troy’s defender. The last book is the return of his body." },
      { name: "Priam", note: "King of Troy. He comes to Achilles’ hut to ransom his son." },
      { name: "Agamemnon", note: "Leader of the Greek force. His quarrel with Achilles starts the plot." },
    ],
    quotes: [
      {
        text: "μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος",
        cite: "Iliad 1.1, Greek. Margem does not quote a modern English translation.",
      },
    ],
    timeline: [
      { label: "Traditional date", detail: "The written poem is usually placed in the eighth century BCE. That date is a tradition, not a document." },
      { label: "Inside the poem", detail: "The action is the ninth year of the war at Troy, and it covers a few weeks of that year." },
      { label: "Later readers", detail: "Virgil’s Aeneid, left unfinished in 19 BCE, starts from a Trojan who leaves the city this poem destroys." },
    ],
  },
  oedipus: {
    placesKind: "real",
    places: [
      {
        name: "Thebes",
        description: "The play is set in front of the palace at Thebes. A plague is on the city when it opens.",
        lon: 23.32,
        lat: 38.32,
        passage: "The whole play",
      },
      {
        name: "Athens",
        description: "Where Sophocles’ plays were produced, at the dramatic festivals. Thebes is the setting, not the theater.",
        lon: 23.73,
        lat: 37.98,
      },
    ],
    context:
      "Sophocles wrote for the Athenian stage in the fifth century BCE. Oedipus the King is one of the seven plays of his that survive complete. The traditional date is about 429 BCE. A plague is on Thebes, and Oedipus searches for the killer of Laius.",
    themes: ["A search that ends at the searcher", "Sight and knowledge", "A city under plague", "Fate already spoken"],
    characters: [
      { name: "Oedipus", note: "King of Thebes. He looks for the man who killed Laius." },
      { name: "Jocasta", note: "Queen of Thebes, and the person the search cannot leave outside it." },
      { name: "Tiresias", note: "The blind prophet who is brought in and does not want to speak." },
      { name: "Creon", note: "Jocasta’s brother. He returns from Delphi with the oracle’s answer." },
    ],
    quotes: [
      {
        text: "Ὦ τέκνα, Κάδμου τοῦ πάλαι νέα τροφή,",
        cite: "Oedipus the King, opening line, Greek. No English translation is quoted here.",
      },
    ],
    timeline: [
      { label: "c. 497 – c. 406 BCE", detail: "Sophocles’ traditional dates. He was born at Colonus, near Athens." },
      { label: "c. 429 BCE", detail: "The usual date given for Oedipus the King. The year is not fixed by a surviving didascalia." },
      { label: "Seven plays", detail: "Seven of his tragedies survive complete, including this one and Antigone." },
    ],
  },
  aeneid: {
    placesKind: "real",
    places: [
      {
        name: "Carthage",
        description: "Books 1 and 4 are set at Dido’s Carthage, on the North African coast.",
        lon: 10.32,
        lat: 36.85,
        passage: "Books 1 and 4",
      },
      {
        name: "Latium",
        description: "The second half brings Aeneas to the mouth of the Tiber, in Latium.",
        lon: 12.23,
        lat: 41.74,
        passage: "The Italian books",
      },
      {
        name: "Troy",
        description: "Book 2 is Aeneas telling the fall of Troy, the city he leaves.",
        lon: 26.24,
        lat: 39.96,
        passage: "Book 2",
      },
    ],
    context:
      "Virgil died at Brundisium in 19 BCE with the Aeneid unfinished, by his own account. The poem follows Aeneas from the fallen Troy, through Carthage, to Italy. It is a Latin epic built on the Iliad and the Odyssey. Dante later puts Virgil in the Comedy as his guide.",
    themes: ["A city left behind", "Duty against delay", "Founding, and its cost", "An unfinished poem"],
    characters: [
      { name: "Aeneas", note: "A Trojan who leaves the city and is told he will found a people in Italy." },
      { name: "Dido", note: "Queen of Carthage. Books 1 and 4 are her meeting with Aeneas and its end." },
      { name: "Turnus", note: "The Italian leader who fights Aeneas in the second half." },
      { name: "Anchises", note: "Aeneas’ father. In the underworld he shows the line of Romans to come." },
    ],
    quotes: [
      {
        text: "Arma virumque cano, Troiae qui primus ab oris",
        cite: "Aeneid 1.1, Latin. Later English translations are separate copyrights.",
      },
    ],
    timeline: [
      { label: "70 BCE", detail: "Virgil is born at Andes, near Mantua." },
      { label: "19 BCE", detail: "He dies at Brundisium. The Aeneid is left unfinished." },
      { label: "Inside the poem", detail: "The story begins just after Troy falls, and ends in Latium before Rome exists." },
    ],
  },
  comedy: {
    placesKind: "mixed",
    places: [
      {
        name: "Florence",
        description: "Dante’s city, named throughout the poem. The journey itself is not a map of its streets.",
        lon: 11.26,
        lat: 43.77,
      },
      {
        name: "Ravenna",
        description: "Where Dante died in 1321, in exile. Not a stop on the journey of the poem.",
        lon: 12.2,
        lat: 44.42,
      },
      {
        name: "The journey",
        description: "Hell, Purgatory, and Paradise. The poem dates the journey to Easter 1300. These are not cities on a map.",
        imagined: true,
        passage: "The whole poem",
      },
    ],
    context:
      "Dante wrote the Comedy in exile, in Tuscan, and died in Ravenna in 1321. Inside the poem the journey is dated to Easter 1300. Virgil guides him through Hell and Purgatory. The Italian text is public domain. A particular English translation may not be.",
    themes: ["Exile", "A guided descent", "Judgment, named person by person", "The poem’s own date, Easter 1300"],
    characters: [
      { name: "Dante", note: "The traveler. The poem is in the first person." },
      { name: "Virgil", note: "The guide through Hell and Purgatory. Dante addresses him as master." },
      { name: "Beatrice", note: "She sends Virgil, and she guides the last part." },
      { name: "Francesca", note: "Among the named dead in the early cantos of Inferno." },
    ],
    quotes: [
      {
        text: "Nel mezzo del cammin di nostra vita",
        cite: "Inferno I.1, Italian. Dante died in 1321.",
      },
    ],
    timeline: [
      { label: "1265", detail: "Dante is born in Florence." },
      { label: "Easter 1300", detail: "The date the poem gives to the journey." },
      { label: "c. 1308 – 1320", detail: "The usual span given for the writing, in exile." },
      { label: "1321", detail: "Dante dies in Ravenna." },
    ],
  },
  quixote: {
    placesKind: "real",
    places: [
      {
        name: "La Mancha",
        description: "The novel names La Mancha and refuses the village’s name. The gentleman rides out from there.",
        lon: -3.02,
        lat: 39.16,
        passage: "Part I, chapter 1",
      },
      {
        name: "Madrid",
        description: "Part one is published in Madrid in 1605. Part two follows in 1615. Cervantes dies there in 1616.",
        lon: -3.7,
        lat: 40.42,
      },
    ],
    context:
      "Miguel de Cervantes publishes the first part of Don Quixote in Madrid in 1605 and the second in 1615. A country gentleman from La Mancha reads chivalric novels until he rides out to live inside them. Part two answers the first, including the fact that part one is already a book. John Ormsby’s English translation of 1885 is public domain. It is not loaded on this device.",
    themes: ["Books that get into the saddle", "A second part that has read the first", "Sancho beside the knight", "A village the narrator will not name"],
    characters: [
      { name: "Don Quixote", note: "Alonso Quixano, once he has named himself and ridden out." },
      { name: "Sancho Panza", note: "His neighbor, who goes with him as squire." },
      { name: "Dulcinea", note: "The lady he invents from a farm girl of the district." },
      { name: "The narrator", note: "He withholds the village’s name in the first sentence." },
    ],
    quotes: [
      {
        text: "In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.",
        cite: "John Ormsby, 1885, Part I, chapter 1. The Spanish of 1605 is also public domain.",
      },
    ],
    timeline: [
      { label: "1547", detail: "Cervantes is born at Alcalá de Henares." },
      { label: "1605", detail: "Part one is published in Madrid." },
      { label: "1615", detail: "Part two is published." },
      { label: "1616", detail: "Cervantes dies in Madrid. Shakespeare dies the same year." },
    ],
  },
  hamlet: {
    placesKind: "real",
    places: [
      {
        name: "Elsinore",
        description: "The play is set at Elsinore, the castle of Kronborg, in Denmark.",
        lon: 12.62,
        lat: 56.04,
        passage: "The play",
      },
      {
        name: "London",
        description: "Where the play was written for the stage, around the turn of the seventeenth century. Not the setting.",
        lon: -0.13,
        lat: 51.51,
      },
    ],
    context:
      "Shakespeare’s plays were written for the London companies. Hamlet belongs to the years around 1599–1601. The prince of Denmark is told that his father was murdered. Shakespeare died in 1616. The play is public domain.",
    themes: ["A ghost’s command", "The play inside the play", "Delay", "A court that ends in the last scene"],
    characters: [
      { name: "Hamlet", note: "Prince of Denmark. He is told his father was murdered." },
      { name: "Claudius", note: "The king, his uncle, who has married Gertrude." },
      { name: "Gertrude", note: "Hamlet’s mother, and the queen." },
      { name: "Ophelia", note: "Polonius’ daughter. The court uses her, and then loses her." },
    ],
    quotes: [
      {
        text: "To be, or not to be, that is the question:",
        cite: "Hamlet, Act 3, Scene 1. Shakespeare died in 1616.",
      },
    ],
    timeline: [
      { label: "1564", detail: "William Shakespeare is baptized at Stratford-upon-Avon on 26 April." },
      { label: "about 1599 – 1601", detail: "The usual window for Hamlet." },
      { label: "23 April 1616", detail: "He dies at Stratford. Cervantes dies the same year." },
    ],
  },
  pride: {
    placesKind: "real",
    places: [
      {
        name: "Hertfordshire",
        description: "Longbourn and Netherfield are set in Hertfordshire. The novel does not pin them to a documented village.",
        lon: -0.2,
        lat: 51.8,
        passage: "The visits",
      },
      {
        name: "Derbyshire",
        description: "Pemberley, Darcy’s house, is in Derbyshire. Elizabeth sees it on a tour.",
        lon: -1.6,
        lat: 53.1,
        passage: "The visit to Pemberley",
      },
      {
        name: "Kent",
        description: "Hunsford, where Mr. Collins is a clergyman, and where Darcy first proposes.",
        lon: 0.7,
        lat: 51.2,
        passage: "The first proposal",
      },
    ],
    context:
      "Jane Austen publishes Pride and Prejudice in 1813. Elizabeth Bennet and Mr. Darcy misread each other across a year of visits, letters, and one disastrous proposal. Austen dies in Winchester in 1817. The English text is public domain. It is not loaded on this device yet.",
    themes: ["First impressions", "A proposal that fails", "Money, entailed", "Letters that correct a speech"],
    characters: [
      { name: "Elizabeth Bennet", note: "The second Bennet daughter. The novel stays closest to her reading of people." },
      { name: "Mr. Darcy", note: "He arrives at the Netherfield ball already disliked, and writes the letter that changes that." },
      { name: "Jane Bennet", note: "Elizabeth’s older sister. Her attachment to Bingley is the other half of the plot." },
      { name: "Mr. Collins", note: "The cousin who will inherit Longbourn, and who proposes first." },
    ],
    quotes: [
      {
        text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        cite: "Pride and Prejudice, 1813, chapter 1.",
      },
    ],
    timeline: [
      { label: "1775", detail: "Austen is born at Steventon, Hampshire." },
      { label: "1813", detail: "Pride and Prejudice is published." },
      { label: "1817", detail: "She dies in Winchester." },
    ],
  },
  frankenstein: {
    placesKind: "mixed",
    places: [
      {
        name: "Geneva",
        description: "The Frankenstein family house is at Geneva.",
        lon: 6.14,
        lat: 46.2,
        passage: "Victor’s childhood",
      },
      {
        name: "Ingolstadt",
        description: "Victor studies, and builds the creature, at the university in Ingolstadt.",
        lon: 11.42,
        lat: 48.76,
        passage: "The making",
      },
      {
        name: "The Arctic ice",
        description: "The novel opens and closes in letters from Robert Walton, whose ship is stuck in the ice. The book does not name a port for that meeting.",
        imagined: true,
        passage: "Walton’s letters",
      },
    ],
    context:
      "Frankenstein; or, The Modern Prometheus is published anonymously in London in 1818. Mary Shelley’s name appears on the 1823 edition. Victor Frankenstein makes a living creature in Ingolstadt and then refuses it. The story is told in Walton’s letters from the Arctic and in Victor’s own account. The 1818 text prints an epigraph from Paradise Lost.",
    themes: ["A maker who will not look", "The creature’s demand for a companion", "Stories nested in letters", "Pursuit north into the ice"],
    characters: [
      { name: "Victor Frankenstein", note: "A student at Ingolstadt who builds a living creature and abandons it." },
      { name: "The creature", note: "He learns to speak, tells his own story, and asks for a companion." },
      { name: "Robert Walton", note: "The explorer whose letters frame the novel." },
      { name: "Elizabeth Lavenza", note: "Raised in the Frankenstein house. The 1818 text makes her Victor’s cousin." },
    ],
    quotes: [
      {
        text: "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.",
        cite: "Frankenstein, 1818, Walton’s first letter.",
      },
    ],
    timeline: [
      { label: "1797", detail: "Mary Shelley is born in London." },
      { label: "1818", detail: "The novel is published anonymously in London." },
      { label: "1823", detail: "Her name appears on the edition." },
      { label: "1851", detail: "She dies in London." },
    ],
  },
  "the-raven": {
    placesKind: "imagined",
    places: [
      {
        name: "The chamber",
        description: "The poem names a chamber, a door, a window, and a bust of Pallas. It does not name a city. The bird perches on the bust.",
        imagined: true,
        passage: "The whole poem",
      },
    ],
    context:
      "Edgar Allan Poe’s The Raven is published in 1845, first in the New York Evening Mirror and then in The Raven and Other Poems. A speaker at midnight answers a tapping and lets in a raven whose only word is Nevermore. Poe dies in 1849. Machado de Assis publishes a Portuguese translation in 1883, and Juan Antonio Pérez Bonalde a Spanish one in 1887. Those three texts are what Margem reads side by side.",
    themes: ["One word, repeated", "A grief the speaker keeps feeding", "Midnight", "The questions are worse than the answer"],
    characters: [
      { name: "The speaker", note: "Alone with books, then with the bird. He supplies the meaning of the one word." },
      { name: "The raven", note: "It enters, perches on the bust of Pallas, and says Nevermore." },
      { name: "Lenore", note: "Named, and absent. The poem is about her not being in the room." },
    ],
    quotes: [
      {
        text: "Once upon a midnight dreary, while I pondered, weak and weary,",
        cite: "The Raven, 1845, first line. The parallel text on this device keeps Poe’s spelling.",
      },
      {
        text: 'Quoth the raven, "Nevermore."',
        cite: "The Raven, 1845. In the 1845 text the bird’s name is not capitalized in this line.",
      },
    ],
    timeline: [
      { label: "1809", detail: "Poe is born in Boston." },
      { label: "29 January 1845", detail: "The Raven appears in the New York Evening Mirror." },
      { label: "1845", detail: "It is collected in The Raven and Other Poems." },
      { label: "1849", detail: "Poe dies in Baltimore." },
      { label: "1883 and 1887", detail: "Machado’s Portuguese translation, then Pérez Bonalde’s Spanish El cuervo." },
    ],
  },
  "dom-casmurro": {
    placesKind: "real",
    places: [
      {
        name: "Rio de Janeiro",
        description: "The remembered streets, the beach at Glória, and the later house in Engenho Novo are in Rio.",
        lon: -43.17,
        lat: -22.91,
        passage: "The memoir",
      },
      {
        name: "Engenho Novo",
        description: "The older Bento writes from a house he has built there, meant to resemble the house of his youth.",
        lon: -43.27,
        lat: -22.91,
        passage: "The frame",
      },
    ],
    context:
      "Machado de Assis publishes Dom Casmurro in Rio in 1899. Bento Santiago, writing in old age, tries to reconstruct his youth with Capitu and whether she betrayed him. The book does not settle it for him. Machado dies in 1908, so the Portuguese text is public domain, including in Brazil. It is not loaded on this device yet.",
    themes: ["A narrator who has already decided", "Memory as a rebuilt house", "Jealousy", "What the book will not confirm"],
    characters: [
      { name: "Bento Santiago", note: "Dom Casmurro. He writes the book in old age, from Engenho Novo." },
      { name: "Capitu", note: "The girl next door, then his wife. The question he cannot close is about her." },
      { name: "Escobar", note: "Bento’s friend. His death is where the suspicion hardens." },
      { name: "Ezequiel", note: "Bento and Capitu’s son. Bento looks at his face and sees someone else." },
    ],
    quotes: [
      {
        text: "Uma noite destas, vindo da cidade de Cascadura para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu.",
        cite: "Dom Casmurro, 1899, chapter 1, “Do título”.",
      },
    ],
    timeline: [
      { label: "1839", detail: "Machado de Assis is born in Rio de Janeiro." },
      { label: "1883", detail: "He publishes his Portuguese translation of The Raven." },
      { label: "1899", detail: "Dom Casmurro is published in Rio." },
      { label: "1908", detail: "He dies in Rio." },
    ],
  },
  crime: {
    placesKind: "real",
    places: [
      {
        name: "St. Petersburg",
        description: "The room, the pawnbroker, the streets, and the investigation are in St. Petersburg.",
        lon: 30.36,
        lat: 59.93,
        passage: "The novel",
      },
      {
        name: "Siberia",
        description: "The epilogue sends Raskolnikov to penal servitude in Siberia.",
        lon: 82.9,
        lat: 55.0,
        passage: "Epilogue",
      },
    ],
    context:
      "Crime and Punishment is serialized in The Russian Messenger in 1866. Raskolnikov, a former student in St. Petersburg, kills a pawnbroker and then lives inside the consequence. Dostoevsky dies in 1881. The Russian text is public domain. An English translation is public domain only when that translation is. Constance Garnett’s was published in 1914. The novel is not loaded on this device.",
    themes: ["A theory that wants a murder", "The days after", "Confession", "A city in summer heat"],
    characters: [
      { name: "Raskolnikov", note: "A former student. He kills the pawnbroker and her sister." },
      { name: "Sonya", note: "She reads the raising of Lazarus to him, and goes with him to Siberia." },
      { name: "Porfiry Petrovich", note: "The investigator who talks more than he accuses." },
      { name: "Svidrigailov", note: "A man who has already crossed a line, and who listens to Raskolnikov’s." },
    ],
    quotes: [
      {
        text: "On an exceptionally hot evening early in July a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.",
        cite: "Constance Garnett, Crime and Punishment, 1914, Part I, chapter 1. The Russian of 1866 is also public domain.",
      },
    ],
    timeline: [
      { label: "1821", detail: "Dostoevsky is born in Moscow." },
      { label: "1866", detail: "Crime and Punishment is serialized." },
      { label: "1881", detail: "He dies in St. Petersburg." },
      { label: "1914", detail: "Constance Garnett’s English translation is published." },
    ],
  },
  anna: {
    placesKind: "real",
    places: [
      {
        name: "Moscow",
        description: "The Oblonsky household, and much of the social plot, are in Moscow.",
        lon: 37.62,
        lat: 55.76,
      },
      {
        name: "St. Petersburg",
        description: "Anna’s life with Karenin is in the capital.",
        lon: 30.31,
        lat: 59.94,
      },
      {
        name: "The country",
        description: "Levin’s estate is the other half of the novel. It draws on the country life Tolstoy knew. The novel does not name Yasnaya Polyana.",
        lon: 37.53,
        lat: 54.07,
        passage: "Levin’s chapters",
      },
    ],
    context:
      "Anna Karenina is published across 1875–1877. Anna leaves her marriage for Vronsky. In parallel, Levin farms, courts Kitty, and argues with himself about how to live. Tolstoy dies in 1910. The Russian text is public domain. Constance Garnett’s English translation of 1901 is public domain in the United States because it was published before 1930. The novel is not loaded here.",
    themes: ["Two plots that do not match", "A marriage already broken in the first scene", "Work on the land", "A society that counts one affair and not the other"],
    characters: [
      { name: "Anna Karenina", note: "She comes to Moscow to mend her brother’s marriage, and meets Vronsky." },
      { name: "Alexei Karenin", note: "Anna’s husband, a statesman in St. Petersburg." },
      { name: "Vronsky", note: "An officer. The affair is public long before anyone agrees to name it." },
      { name: "Levin", note: "He farms, proposes to Kitty twice, and keeps asking how a person should live." },
    ],
    quotes: [
      {
        text: "Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему.",
        cite: "Anna Karenina, Part I, chapter 1, Russian. Tolstoy died in 1910.",
      },
    ],
    timeline: [
      { label: "1828", detail: "Tolstoy is born at Yasnaya Polyana." },
      { label: "1875 – 1877", detail: "Anna Karenina is published in parts." },
      { label: "1901", detail: "Constance Garnett’s English translation is published." },
      { label: "1910", detail: "Tolstoy dies." },
    ],
  },
  metamorphosis: {
    placesKind: "imagined",
    places: [
      {
        name: "The Samsa flat",
        description: "The story names a flat, a bedroom door, and an office. It does not name Prague. Gregor’s room shrinks as the family reclaims it.",
        imagined: true,
        passage: "The story",
      },
    ],
    context:
      "Franz Kafka’s Die Verwandlung is published in 1915. Gregor Samsa wakes changed and then loses, room by room, his job, his family, and the space they will give him. Kafka is born in Prague in 1883, then part of Austria-Hungary, and dies in 1924. The German text is public domain. A given English translation still needs its own check. The story is not loaded on this device.",
    themes: ["A body that will not serve the office", "A door that stays shut", "The family’s rearrangement", "A room taken back"],
    characters: [
      { name: "Gregor Samsa", note: "A traveling salesman. He wakes unable to get up and go to work." },
      { name: "Grete", note: "His sister. She brings the food, and later she is the one who says he has to go." },
      { name: "The father", note: "He drives Gregor back into the room. Later he goes back to work in a uniform." },
      { name: "The chief clerk", note: "He comes to the flat on the first morning, from the office." },
    ],
    quotes: [
      {
        text: "Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt.",
        cite: "Die Verwandlung, 1915, first sentence, German. The spelling “ungeheueren” is the 1915 text.",
      },
    ],
    timeline: [
      { label: "1883", detail: "Kafka is born in Prague." },
      { label: "1915", detail: "Die Verwandlung is published." },
      { label: "1924", detail: "He dies. In life-plus-seventy countries the term ended in 1994." },
    ],
  },
}

export function bookProfile(workId: string): BookProfile | undefined {
  return BOOK_PROFILES[workId]
}
