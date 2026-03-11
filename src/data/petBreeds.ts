export interface Breed {
  id: string;
  name: string;
}

export interface PetBreeds {
  [petType: string]: Breed[];
}

export const PET_BREEDS: PetBreeds = {
  dog: [
    { id: 'beagle', name: 'Beagle' },
    { id: 'bulldog', name: 'Bulldog' },
    { id: 'dachshund', name: 'Dachshund' },
    { id: 'french-bulldog', name: 'French Bulldog' },
    { id: 'german-shepherd', name: 'German Shepherd Dog' },
    { id: 'golden-retriever', name: 'Golden Retriever' },
    { id: 'labrador-retriever', name: 'Labrador Retriever' },
    { id: 'poodle', name: 'Poodle' },
    { id: 'rottweiler', name: 'Rottweiler' },
    { id: 'yorkshire-terrier', name: 'Yorkshire Terrier' },
  ],
  cat: [
    { id: 'abyssinian', name: 'Abyssinian' },
    { id: 'american-shorthair', name: 'American Shorthair' },
    { id: 'british-shorthair', name: 'British Shorthair' },
    { id: 'devon-rex', name: 'Devon Rex' },
    { id: 'exotic-shorthair', name: 'Exotic Shorthair' },
    { id: 'maine-coon', name: 'Maine Coon' },
    { id: 'persian', name: 'Persian' },
    { id: 'ragdoll', name: 'Ragdoll' },
    { id: 'scottish-fold', name: 'Scottish Fold' },
    { id: 'sphynx', name: 'Sphynx' },
  ],
  fish: [
    { id: 'angelfish', name: 'Angelfish' },
    { id: 'betta', name: 'Betta (Siamese fighting fish)' },
    { id: 'goldfish', name: 'Goldfish' },
    { id: 'gourami', name: 'Gourami' },
    { id: 'guppy', name: 'Guppy' },
    { id: 'koi', name: 'Koi' },
    { id: 'molly', name: 'Molly' },
    { id: 'platy', name: 'Platy' },
    { id: 'tetra', name: 'Tetra (Neon Tetra)' },
    { id: 'zebra-danio', name: 'Zebra Danio' },
  ],
  bird: [
    { id: 'african-grey', name: 'African Grey Parrot' },
    { id: 'budgerigar', name: 'Budgerigar (Budgie)' },
    { id: 'canary', name: 'Canary' },
    { id: 'cockatiel', name: 'Cockatiel' },
    { id: 'cockatoo', name: 'Cockatoo' },
    { id: 'finch', name: 'Finch' },
    { id: 'lovebird', name: 'Lovebird' },
    { id: 'macaw', name: 'Macaw' },
    { id: 'parakeet', name: 'Parakeet' },
    { id: 'parrot', name: 'Parrot (General)' },
  ],
  rabbit: [
    { id: 'dutch-rabbit', name: 'Dutch Rabbit' },
    { id: 'english-angora', name: 'English Angora' },
    { id: 'flemish-giant', name: 'Flemish Giant' },
    { id: 'french-lop', name: 'French Lop' },
    { id: 'holland-lop', name: 'Holland Lop' },
    { id: 'lionhead', name: 'Lionhead' },
    { id: 'mini-lop', name: 'Mini Lop' },
    { id: 'mini-rex', name: 'Mini Rex' },
    { id: 'netherland-dwarf', name: 'Netherland Dwarf' },
    { id: 'rex-rabbit', name: 'Rex Rabbit' },
  ],
  hamster: [
    { id: 'black-bear', name: 'Black Bear Hamster' },
    { id: 'chinese', name: 'Chinese Hamster' },
    { id: 'dwarf-campbell', name: 'Dwarf Campbell Russian Hamster' },
    { id: 'golden', name: 'Golden Hamster' },
    { id: 'long-haired-syrian', name: 'Long-haired Syrian Hamster' },
    { id: 'panda', name: 'Panda Hamster' },
    { id: 'roborovski', name: 'Roborovski Dwarf Hamster' },
    { id: 'syrian', name: 'Syrian Hamster' },
    { id: 'teddy-bear', name: 'Teddy Bear Hamster' },
    { id: 'winter-white', name: 'Winter White Dwarf Hamster' },
  ],
  turtle: [
    { id: 'african-sideneck', name: 'African Sideneck Turtle' },
    { id: 'box-turtle', name: 'Box Turtle' },
    { id: 'diamondback-terrapin', name: 'Diamondback Terrapin' },
    { id: 'map-turtle', name: 'Map Turtle' },
    { id: 'mud-turtle', name: 'Mud Turtle' },
    { id: 'musk-turtle', name: 'Musk Turtle' },
    { id: 'painted-turtle', name: 'Painted Turtle' },
    { id: 'red-eared-slider', name: 'Red-Eared Slider' },
    { id: 'reeves-turtle', name: "Reeves' Turtle" },
    { id: 'yellow-bellied-slider', name: 'Yellow-Bellied Slider' },
  ],
  'guinea-pig': [
    { id: 'abyssinian-gp', name: 'Abyssinian Guinea Pig' },
    { id: 'american-gp', name: 'American Guinea Pig' },
    { id: 'coronet', name: 'Coronet Guinea Pig' },
    { id: 'crested', name: 'Crested Guinea Pig' },
    { id: 'himalayan', name: 'Himalayan Guinea Pig' },
    { id: 'peruvian', name: 'Peruvian Guinea Pig' },
    { id: 'silkie', name: 'Silkie (Sheltie) Guinea Pig' },
    { id: 'skinny-pig', name: 'Skinny Pig' },
    { id: 'teddy-gp', name: 'Teddy Guinea Pig' },
    { id: 'texel', name: 'Texel Guinea Pig' },
  ],
  horse: [
    { id: 'andalusian', name: 'Andalusian' },
    { id: 'appaloosa', name: 'Appaloosa' },
    { id: 'arabian', name: 'Arabian' },
    { id: 'clydesdale', name: 'Clydesdale' },
    { id: 'friesian', name: 'Friesian' },
    { id: 'hanoverian', name: 'Hanoverian' },
    { id: 'paint-horse', name: 'Paint Horse' },
    { id: 'quarter-horse', name: 'Quarter Horse' },
    { id: 'shetland-pony', name: 'Shetland Pony' },
    { id: 'thoroughbred', name: 'Thoroughbred' },
  ],
  other: [],
};

export function getBreeds(petType: string): Breed[] {
  return PET_BREEDS[petType] || [];
}
