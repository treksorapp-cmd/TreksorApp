import { RitualCard } from "@/types/ritualCard";

export const ritualCards: RitualCard[] = [
  {
    id: "body",
    title: "BODY",
    ritualsCompleted: 3,
    totalRituals: 5,
    image: require("@/assets/images/body-ritual.png"),
    backgroundColor: "#2D4A3E",
    route: "/body",
  },
  {
    id: "mental",
    title: "MIND",
    ritualsCompleted: 5,
    totalRituals: 7,
    image: require("@/assets/images/mental-ritual.png"),
    backgroundColor: "#3D3D3D",
    route: "/mental",
  },
  {
    id: "spiritual",
    title: "SPIRITUAL",
    ritualsCompleted: 3,
    totalRituals: 4,
    image: require("@/assets/images/spiritual-ritual.png"),
    backgroundColor: "#4A3D2D",
    route: "/spiritual",
  },
  {
    id: "purpose",
    title: "PURPOSE",
    ritualsCompleted: 0,
    totalRituals: 0,
    image: require("@/assets/images/locked-ritual.png"),
    isLocked: true,
    availableDate: "In development",
    backgroundColor: "#2D2D2D",
    route: "/purpose",
  },
];