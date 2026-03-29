import dogImg from "@assets/stock_images/happy_dog_portrait_o_6e5075a4.jpg";
import catImg from "@assets/stock_images/ginger_cat_sitting_f_07d19cb3.jpg";
import fishImg from "@assets/stock_images/goldfish_in_a_bowl_o_1769c4d6.jpg";
import birdImg from "@assets/stock_images/colorful_parrot_bird_78491bbe.jpg";
import rabbitImg from "@assets/stock_images/cute_white_rabbit_po_8b3eec97.jpg";
import hamsterImg from "@assets/stock_images/cute_hamster_portrai_97a17a6a.jpg";
import turtleImg from "@assets/stock_images/turtle_close_up_port_f8acb4e1.jpg";
import guineaPigImg from "@assets/stock_images/guinea_pig_portrait_48d4dfd3.jpg";
import horseImg from "@assets/stock_images/horse_portrait_in_na_95b7a90d.jpg";

export const PETS = [
  { id: "dog", name: "Dog", image: dogImg },
  { id: "cat", name: "Cat", image: catImg },
  { id: "fish", name: "Fish", image: fishImg },
  { id: "bird", name: "Bird", image: birdImg },
  { id: "rabbit", name: "Rabbit", image: rabbitImg },
  { id: "hamster", name: "Hamster", image: hamsterImg },
  { id: "turtle", name: "Turtle", image: turtleImg },
  { id: "guinea-pig", name: "Guinea Pig", image: guineaPigImg },
  { id: "horse", name: "Horse", image: horseImg },
  { id: "other", name: "Other", isIcon: true },
];

export const getAvailableDurations = (role: string) => {
  const base = [
    { label: "6 Hours", value: "6h" },
    { label: "12 Hours", value: "12h" },
    { label: "24 Hours", value: "24h" },
  ];
  if (role === "moderator") return base;
  const superMod = [
    ...base,
    { label: "3 Days", value: "3d" },
    { label: "7 Days", value: "7d" },
  ];
  if (role === "super_moderator") return superMod;
  return [
    ...superMod,
    { label: "30 Days", value: "30d" },
    { label: "1 Year", value: "1y" },
    { label: "Permanent", value: "permanent" },
  ];
};
