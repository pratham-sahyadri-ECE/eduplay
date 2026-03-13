/**
 * gk-questions.js  –  General Knowledge question bank
 * Math Racing – Smart Classroom Edition
 *
 * Each question: { q, opts: [A,B,C,D], ans: 0|1|2|3 }
 * ans is 0-indexed (0 = A, 1 = B, 2 = C, 3 = D)
 */

const GKQuestions = (() => {

    const bank = {

        science: [
            {
                q: "What is the chemical symbol for water?",
                opts: ["H₂O", "CO₂", "NaCl", "O₂"], ans: 0
            },
            {
                q: "Which planet is known as the Red Planet?",
                opts: ["Venus", "Mars", "Jupiter", "Saturn"], ans: 1
            },
            {
                q: "What gas do plants absorb from the atmosphere?",
                opts: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], ans: 2
            },
            {
                q: "How many bones are in the adult human body?",
                opts: ["196", "206", "216", "226"], ans: 1
            },
            {
                q: "What is the powerhouse of the cell?",
                opts: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], ans: 2
            },
            {
                q: "Which is the largest planet in our solar system?",
                opts: ["Saturn", "Uranus", "Neptune", "Jupiter"], ans: 3
            },
            {
                q: "What force keeps us on Earth?",
                opts: ["Magnetism", "Gravity", "Friction", "Tension"], ans: 1
            },
            {
                q: "What is the speed of light (approx.)?",
                opts: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁴ m/s", "3×10¹⁰ m/s"], ans: 0
            },
            {
                q: "Which vitamin is produced when skin is exposed to sunlight?",
                opts: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], ans: 3
            },
            {
                q: "What is the hardest natural substance on Earth?",
                opts: ["Gold", "Iron", "Diamond", "Quartz"], ans: 2
            },
            {
                q: "How many chambers does a human heart have?",
                opts: ["2", "3", "4", "5"], ans: 2
            },
            {
                q: "What is the chemical symbol for gold?",
                opts: ["Go", "Au", "Gd", "Ag"], ans: 1
            },
            {
                q: "Which organ filters blood in the human body?",
                opts: ["Liver", "Heart", "Lungs", "Kidneys"], ans: 3
            },
            {
                q: "What is the process by which plants make food?",
                opts: ["Respiration", "Photosynthesis", "Digestion", "Osmosis"], ans: 1
            },
            {
                q: "Which planet has the most moons?",
                opts: ["Jupiter", "Saturn", "Uranus", "Neptune"], ans: 1
            },
            {
                q: "What is the boiling point of water at sea level?",
                opts: ["90°C", "95°C", "100°C", "105°C"], ans: 2
            },
            {
                q: "DNA stands for?",
                opts: ["Deoxyribonucleic Acid", "Diribonuclear Acid", "Dynamic Nucleic Acid", "Dense Nucleic Array"], ans: 0
            },
            {
                q: "What is the atomic number of Carbon?",
                opts: ["4", "6", "8", "12"], ans: 1
            },
            {
                q: "Sound travels fastest through which medium?",
                opts: ["Air", "Water", "Vacuum", "Steel"], ans: 3
            },
            {
                q: "Which is the smallest planet in the solar system?",
                opts: ["Mars", "Venus", "Mercury", "Pluto"], ans: 2
            },
        ],

        history: [
            {
                q: "Who was the first President of the United States?",
                opts: ["Abraham Lincoln", "John Adams", "George Washington", "Thomas Jefferson"], ans: 2
            },
            {
                q: "In which year did World War II end?",
                opts: ["1943", "1944", "1945", "1946"], ans: 2
            },
            {
                q: "Which ancient wonder was located in Alexandria?",
                opts: ["Colossus of Rhodes", "Lighthouse of Alexandria", "Hanging Gardens", "Temple of Artemis"], ans: 1
            },
            {
                q: "Who invented the telephone?",
                opts: ["Thomas Edison", "Nikola Tesla", "Alexander Graham Bell", "Guglielmo Marconi"], ans: 2
            },
            {
                q: "The French Revolution began in which year?",
                opts: ["1776", "1789", "1804", "1815"], ans: 1
            },
            {
                q: "Who was the first man to walk on the Moon?",
                opts: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"], ans: 2
            },
            {
                q: "Which empire was ruled by Julius Caesar?",
                opts: ["Greek Empire", "Ottoman Empire", "Roman Empire", "Persian Empire"], ans: 2
            },
            {
                q: "The Titanic sank in which year?",
                opts: ["1910", "1911", "1912", "1913"], ans: 2
            },
            {
                q: "Who painted the Mona Lisa?",
                opts: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], ans: 2
            },
            {
                q: "India gained independence from Britain in which year?",
                opts: ["1945", "1946", "1947", "1948"], ans: 2
            },
            {
                q: "Who wrote 'Romeo and Juliet'?",
                opts: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], ans: 1
            },
            {
                q: "The Berlin Wall fell in which year?",
                opts: ["1985", "1987", "1989", "1991"], ans: 2
            },
            {
                q: "Which country was the first to give women the right to vote?",
                opts: ["USA", "UK", "New Zealand", "France"], ans: 2
            },
            {
                q: "Who discovered penicillin?",
                opts: ["Marie Curie", "Louis Pasteur", "Alexander Fleming", "Edward Jenner"], ans: 2
            },
            {
                q: "The ancient city of Pompeii was destroyed by which volcano?",
                opts: ["Etna", "Vesuvius", "Stromboli", "Krakatoa"], ans: 1
            },
        ],

        geography: [
            {
                q: "What is the capital city of Australia?",
                opts: ["Sydney", "Melbourne", "Canberra", "Brisbane"], ans: 2
            },
            {
                q: "Which is the longest river in the world?",
                opts: ["Amazon", "Congo", "Nile", "Yangtze"], ans: 2
            },
            {
                q: "On which continent is the Sahara Desert located?",
                opts: ["Asia", "South America", "Australia", "Africa"], ans: 3
            },
            {
                q: "Which country is both a continent and a country?",
                opts: ["Brazil", "Greenland", "Australia", "India"], ans: 2
            },
            {
                q: "What is the highest mountain in the world?",
                opts: ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"], ans: 2
            },
            {
                q: "Which ocean is the largest?",
                opts: ["Atlantic", "Indian", "Arctic", "Pacific"], ans: 3
            },
            {
                q: "The Amazon River is located in which continent?",
                opts: ["North America", "Africa", "South America", "Asia"], ans: 2
            },
            {
                q: "What is the capital of Japan?",
                opts: ["Osaka", "Kyoto", "Tokyo", "Hiroshima"], ans: 2
            },
            {
                q: "Which country has the most natural lakes?",
                opts: ["Russia", "USA", "Brazil", "Canada"], ans: 3
            },
            {
                q: "What is the capital of Brazil?",
                opts: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], ans: 2
            },
            {
                q: "Which is the smallest country in the world?",
                opts: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], ans: 2
            },
            {
                q: "The Great Barrier Reef is located off the coast of which country?",
                opts: ["New Zealand", "Australia", "Indonesia", "Philippines"], ans: 1
            },
            {
                q: "Which continent has the most countries?",
                opts: ["Asia", "Europe", "Africa", "Americas"], ans: 2
            },
            {
                q: "What is the capital of Canada?",
                opts: ["Toronto", "Vancouver", "Montreal", "Ottawa"], ans: 3
            },
            {
                q: "Which desert is the coldest on Earth?",
                opts: ["Gobi", "Sahara", "Antarctic", "Arctic"], ans: 2
            },
        ],

        sports: [
            {
                q: "How many players are on a football (soccer) team?",
                opts: ["9", "10", "11", "12"], ans: 2
            },
            {
                q: "In which sport would you perform a 'slam dunk'?",
                opts: ["Volleyball", "Basketball", "Handball", "Water Polo"], ans: 1
            },
            {
                q: "Which country hosted the 2020 Summer Olympics?",
                opts: ["China", "Brazil", "Japan", "France"], ans: 2
            },
            {
                q: "How many points is a touchdown worth in American Football?",
                opts: ["4", "5", "6", "7"], ans: 2
            },
            {
                q: "Which country has won the FIFA World Cup the most times?",
                opts: ["Germany", "Argentina", "Brazil", "Italy"], ans: 2
            },
            {
                q: "In tennis, what is the term for zero points?",
                opts: ["Nil", "Love", "Zero", "Duck"], ans: 1
            },
            {
                q: "How many rings are on the Olympic flag?",
                opts: ["4", "5", "6", "7"], ans: 1
            },
            {
                q: "Which sport uses a shuttlecock?",
                opts: ["Squash", "Tennis", "Badminton", "Table Tennis"], ans: 2
            },
            {
                q: "How many players are on a cricket team?",
                opts: ["9", "10", "11", "12"], ans: 2
            },
            {
                q: "What is the maximum score in a single game of ten-pin bowling?",
                opts: ["200", "250", "300", "350"], ans: 2
            },
            {
                q: "In which sport do you play in a 'rink'?",
                opts: ["Curling", "Polo", "Lacrosse", "Rugby"], ans: 0
            },
            {
                q: "Which athlete is often called the 'fastest man alive'?",
                opts: ["Carl Lewis", "Michael Johnson", "Usain Bolt", "Justin Gatlin"], ans: 2
            },
            {
                q: "How long is a standard marathon race (km)?",
                opts: ["40km", "41.195km", "42.195km", "43km"], ans: 2
            },
            {
                q: "Which country invented the sport of cricket?",
                opts: ["Australia", "India", "South Africa", "England"], ans: 3
            },
            {
                q: "In volleyball, how many players are on each side of the net?",
                opts: ["4", "5", "6", "7"], ans: 2
            },
        ],

        general: [
            {
                q: "How many colors are in a rainbow?",
                opts: ["5", "6", "7", "8"], ans: 2
            },
            {
                q: "Which is the largest organ in the human body?",
                opts: ["Liver", "Lungs", "Brain", "Skin"], ans: 3
            },
            {
                q: "How many sides does a hexagon have?",
                opts: ["5", "6", "7", "8"], ans: 1
            },
            {
                q: "What is the currency of Japan?",
                opts: ["Yuan", "Won", "Yen", "Ringgit"], ans: 2
            },
            {
                q: "Which language has the most native speakers worldwide?",
                opts: ["English", "Spanish", "Hindi", "Mandarin Chinese"], ans: 3
            },
            {
                q: "What does 'www' stand for in a website URL?",
                opts: ["World Wide Web", "World Web Wire", "Wide World Web", "World Wire Wide"], ans: 0
            },
            {
                q: "How many stripes are on the US flag?",
                opts: ["11", "12", "13", "14"], ans: 2
            },
            {
                q: "What is the most widely spoken language in Latin America?",
                opts: ["Portuguese", "Spanish", "English", "French"], ans: 1
            },
            {
                q: "Which element has the symbol 'Fe'?",
                opts: ["Fluorine", "Iron", "Fermium", "Francium"], ans: 1
            },
            {
                q: "In which year was the internet made publicly available?",
                opts: ["1989", "1991", "1993", "1995"], ans: 1
            },
            {
                q: "How many teeth does an adult human have?",
                opts: ["28", "30", "32", "34"], ans: 2
            },
            {
                q: "What is the largest mammal on Earth?",
                opts: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], ans: 1
            },
            {
                q: "Which country is the largest by land area?",
                opts: ["China", "USA", "Canada", "Russia"], ans: 3
            },
            {
                q: "How many minutes are in a day?",
                opts: ["1200", "1440", "1600", "1800"], ans: 1
            },
            {
                q: "What is the primary ingredient in glass?",
                opts: ["Quartz sand", "Limestone", "Calcium carbonate", "Sodium chloride"], ans: 0
            },
        ],
    };

    // Merge all categories
    const all = [
        ...bank.science,
        ...bank.history,
        ...bank.geography,
        ...bank.sports,
        ...bank.general,
    ];

    /**
     * Fisher-Yates shuffle
     */
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Get n random questions. category = 'all' | 'science' | 'history' | 'geography' | 'sports' | 'general'
     */
    function getRandomSet(n = 10, category = 'all') {
        const pool = category === 'all' ? all : (bank[category] || all);
        return shuffle(pool).slice(0, Math.min(n, pool.length));
    }

    return { bank, all, getRandomSet };
})();
