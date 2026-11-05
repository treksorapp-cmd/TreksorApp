import { Mediation } from "@/types/mediation";

export const mediations: Mediation[] = [
  {
    id: "beginner",
    title: "BEGINNER",
    level: "beginner",
    category: "breathing",
    source: "Source: A simple, fast way to reduce stress",
    url: "https://www.mayoclinic.org/tests-procedures/meditation/in-depth/meditation/art-20045858",
    audioUrl: "https://app.treksor.com/uploads/MEDITATION_BEGGINER.mp3",
    content: {
      description:
        "<p>Control the breath to gain focus, calm the mind, and reduce stress. This beginner-level practice uses rhythmic inhalation and exhalation to improve awareness, balance energy, and relax the nervous system. By tuning into the natural rhythm of your breath, you’ll learn to ground yourself and enter a meditative state with ease.</p>",
      experience: [
        "Increased relaxation",
        "Sharpened awareness of body and mind",
        "A sense of balance and inner quiet",
      ],
    },
    tip: "Practice Pranayama before work, during breaks, or before sleep to reset your state of mind.",
  },
  {
    id: "intermediate",
    title: "INTERMEDIATE",
    level: "intermediate",
    category: "mindfulness",
    audioUrl: "https://app.treksor.com/uploads/MEDITATION_INTERMEDIATE.mp3",
    content: {
      description:
        "<p>This intermediate-level meditation takes you through the seven major chakras, or energy centers of the body. It uses color visualization, focused breathing, and awareness to unblock stagnant energy and restore inner harmony.</p>",
      experience: [
        "Improved emotional regulation",
        "A greater sense of connectedness to your body and purpose",
        "Alignment of mind, body, and spirit",
      ],
    },
    tip: "You may keep a journal of sensations or emotions that arise during each chakra visualization for deeper insight.",
    source: "Source: A simple, fast way to reduce stress",
    url: "https://www.mayoclinic.org/tests-procedures/meditation/in-depth/meditation/art-20045858",
  },
  {
    id: "advanced",
    title: "ADVANCED",
    level: "advanced",
    category: "visualization",
    audioUrl: "https://app.treksor.com/uploads/MEDITATION_ADVANCE.mp3",
    content: {
      description:
        "<p>Viyara is a high-level guided imagery meditation that transports you beyond thought and sensation. This technique uses symbolic journeys and inner landscapes to connect you to a state of higher consciousness.</p>",
      experience: [
        "Deep emotional release and calm",
        "A feeling of timeless presence or floating awareness",
        "Heightened intuition and spiritual insight",
      ],
    },
    tip: "Use headphones and close your eyes in a quiet space. Let go of expectation and simply observe.",
    source: "Effectiveness and Safety",
    url: "https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety",
  },
];
