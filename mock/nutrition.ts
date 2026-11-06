export const Nutritions = {
  beverages: {
    route: "/body/nutrition/beverage-details",
    backgroundImage: require("@/assets/images/beverages-home.png"),
    headerTitle: "Beverages",
    data: [
      {
        id: "elixir-noir",
        name: "ELIXIR NOIR",
        icon: require("@/assets/images/elixir-noir.png"),
        description: `A warm lemon drink with turmeric, ginger, cinnamon, black pepper and bee pollen.`,
        backgroundImage: require("@/assets/images/elixir-noir-home.png"),
        quantity: "(1 cup)",
        ingredients: [
          {
            id: "turmeric",
            name: "Turmeric",
            measurement: "(1 tsp)",
          },
          {
            id: "black-pepper",
            name: "Black Pepper",
            measurement: "(A Pinch)",
          },
          {
            id: "ginger",
            name: "Ginger (Fresh or Powder)",
            measurement: "(1 slices or 1 tsp)",
          },
          {
            id: "cinnamon",
            name: "Cinnamon (Stick or Ground)",
            measurement: "(1 tsp)",
          },
          {
            id: "bee-pollen",
            name: "Bee Pollen",
            measurement: "(1.5 tsp)",
          },
          {
            id: "lemon",
            name: "Fresh Lemon Juice",
            measurement: "(a squeeze)",
          },
          {
            id: "water",
            name: "Hot Water",
            measurement: "(To fill the cup)",
          },
        ],
        footNote: "Contains bee pollen. Review ingredients and product labels for allergies.",
        source_1: "NIH – National Center for Complementary and Integrative Health (NCCIH)",
        url_1: "https://www.nccih.nih.gov/health/turmeric",
        source_2: "NIH – National Center for Complementary and Integrative Health (NCCIH)",
        url_2: "https://www.nccih.nih.gov/health/ginger",
        source_3: "NIH – Office of Dietary Supplements (ODS): Vitamin C (lemon juice)",
        url_3: "https://ods.od.nih.gov/factsheets/VitaminC-Consumer/",
      },
      {
        id: "electro-boost",
        name: "ELECTRO BOOST",
        icon: require("@/assets/images/electro-boost.png"),
        description: `A blended watermelon drink with lemon, ginger and a little salt. Strawberries are optional.`,
        backgroundImage: require("@/assets/images/electro-boost-home.png"),
        quantity: "(500 ml - prepare in a blender)",
        ingredients: [
          {
            id: "watermelon",
            name: "Watermelon",
            measurement: "(1 cup)",
          },
          {
            id: "strawberries",
            name: "Strawberries (Optional)",
            measurement: "(2)",
          },
          {
            id: "black-pepper",
            name: "Black Pepper",
            measurement: "(A Pinch)",
          },
          {
            id: "sea-salt",
            name: "Sea Salt",
            measurement: "(¼ tsp)",
          },
          {
            id: "ginger",
            name: "Ginger",
            measurement: "(1 slice or ½ tsp)",
          },
          {
            id: "lemon",
            name: "Lemon Juice",
            measurement: "(½ lemon)",
          }
        ],
        footNote: "Contains added salt. Review ingredients and adjust the recipe to your needs.",
        source_1: "Harvard Health – Using food to stay hydrated",
        url_1: "https://www.health.harvard.edu/staying-healthy/using-food-to-stay-hydrated",
        source_2: "NIH – National Center for Complementary and Integrative Health (NCCIH): Ginger",
        url_2: "https://www.nccih.nih.gov/health/ginger",
        source_3: "American Heart Association: Dietary sodium & hydration (sea salt reference)",
        url_3: "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium",
      },
      {
        id: "green-tonic",
        name: "GREEN TONIC",
        icon: require("@/assets/images/green-tonic.png"),
        description: `A fresh blend of celery, cucumber, green apple, lemon and ginger.`,
        backgroundImage: require("@/assets/images/green-tonic-home.png"),
        quantity: "(500 ml - prepare in a blender)",
        ingredients: [
          {
            id: "celery",
            name: "Celery",
            measurement: "(2 stalks)",
          },
          {
            id: "cucumber",
            name: "Cucumber",
            measurement: "(½ cucumber)",
          },
          {
            id: "green-apple",
            name: "Green Apple",
            measurement: "(½ apple)",
          },
          {
            id: "lemon",
            name: "Lemon Juice",
            measurement: "(½ lemon)",
          },
          {
            id: "ginger",
            name: "Fresh ginger",
            measurement: "(1 slices or ½ tsp)",
          },
          {
            id: "water",
            name: "Water",
            measurement: "(250ml)",
          },
        ],
        footNote: "Contains celery. Review ingredients and product labels for allergies.",
        source_1: "Harvard Health – Using food to stay hydrated",
        url_1: "https://www.health.harvard.edu/staying-healthy/using-food-to-stay-hydrated",
        source_2: "NIH – Office of Dietary Supplements (ODS): Vitamin C (lemon juice)",
        url_2: "https://ods.od.nih.gov/factsheets/VitaminC-Consumer/",
      },
    ],
  },
  supplements: {
    backgroundImage: require("@/assets/images/supplements-home.png"),
    headerTitle: "Supplements",
    route: "/body/nutrition/supplement-details",
    data: [
      {
        id: "creatine",
        name: "Creatine",
        backgroundImage: require("@/assets/images/creatine-home.png"),
        description:
          "Creatine is a compound found in muscle and available as a supplement. The reference below covers its uses, evidence and precautions.",
        warning: "For questions about whether a supplement fits your needs or medicines, speak with a qualified health professional.",
        source: "Source: Mayo Clinic – Creatine",
        url: "https://www.mayoclinic.org/drugs-supplements-creatine/art-20347591",
      },
      {
        id: "omega-3",
        name: "Omega-3",
        backgroundImage: require("@/assets/images/omega-home.png"),
        description:
          "Omega-3 fatty acids are found in foods such as fish, flaxseed and walnuts. The forms and amounts vary by food and supplement.",
        warning: "For questions about whether a supplement fits your needs or medicines, speak with a qualified health professional.",
        source:
          "Source: NIH Office of Dietary Supplements – Omega-3 Fatty Acids",
        url: "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/",
      },
      {
        id: "b12",
        name: "B12",
        backgroundImage: require("@/assets/images/b12-home.png"),
        description:
          "Vitamin B12 helps keep nerve and blood cells healthy and is involved in making DNA. Sources include animal foods and some fortified foods.",
        warning: "For questions about whether a supplement fits your needs or medicines, speak with a qualified health professional.",
        source: "Source: NIH Office of Dietary Supplements – Vitamin B12",
        url: "https://ods.od.nih.gov/factsheets/VitaminB12-Consumer/",
      },
    ],
  },
};
