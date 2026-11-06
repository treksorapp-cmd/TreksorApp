export type MealIdea = {
  id: string;
  name: string;
  description: string;
  minutes: number;
  timing?: string;
  plantBased: boolean;
  image: number;
  ingredients: readonly string[];
  steps: readonly string[];
  allergens: string;
};

// Treksor editorial recipes. Images illustrate the dishes and their ingredients.
export const mealIdeas: readonly MealIdea[] = [
  {
    id: "lemon-chickpeas",
    name: "Lemon chickpea bowl",
    description: "Bright lemon, crunchy cucumber and chickpeas over brown rice.",
    minutes: 10,
    plantBased: true,
    image: require("@/assets/images/meals/lemon-chickpeas.jpg"),
    ingredients: ["½ cup canned chickpeas, drained", "½ cup cooked brown rice", "¼ cucumber", "1 small tomato", "½ lemon", "1 tsp olive oil"],
    steps: ["Rinse the chickpeas. Dice the cucumber and tomato.", "Combine with the cooked rice. Finish with lemon juice and olive oil."],
    allergens: "Check packaged ingredients and any substitutions for your allergens.",
  },
  {
    id: "oats-berries",
    name: "Overnight oats & berries",
    description: "A make-ahead breakfast with berries, oats and chia.",
    minutes: 5,
    timing: "5 min prep · chill overnight",
    plantBased: true,
    image: require("@/assets/images/meals/oats-berries.jpg"),
    ingredients: ["½ cup rolled oats", "½ cup unsweetened soy drink", "1 tsp chia seeds", "½ cup berries"],
    steps: ["Stir the oats, soy drink and chia together in a clean covered container.", "Refrigerate overnight. Add the washed berries before serving."],
    allergens: "Contains soy. Check oats for gluten and the labels for cross-contact.",
  },
  {
    id: "egg-spinach",
    name: "Egg & spinach wrap",
    description: "A warm wholegrain wrap with soft scrambled eggs and spinach.",
    minutes: 15,
    plantBased: false,
    image: require("@/assets/images/meals/egg-spinach.jpg"),
    ingredients: ["2 eggs", "1 handful spinach", "1 small tomato", "1 wholegrain tortilla", "1 tsp olive oil"],
    steps: ["Wilt the spinach in a pan with olive oil.", "Add beaten eggs and stir until fully set. Spoon into the tortilla with chopped tomato and fold."],
    allergens: "Contains egg and wheat. Check the tortilla label for other allergens.",
  },
  {
    id: "tomato-bean-pasta",
    name: "Tomato & white bean pasta",
    description: "Wholegrain pasta with a tomato, spinach and white bean sauce.",
    minutes: 20,
    plantBased: true,
    image: require("@/assets/images/meals/tomato-bean-pasta.jpg"),
    ingredients: ["75 g wholegrain pasta", "½ cup canned white beans, drained", "½ cup canned crushed tomatoes", "1 handful spinach", "1 tsp olive oil"],
    steps: ["Cook the pasta according to the package directions.", "Heat the tomatoes, rinsed beans and spinach in a pan until bubbling. Toss with the drained pasta and olive oil."],
    allergens: "Contains wheat. Check the labels of the pasta and canned ingredients.",
  },
];
