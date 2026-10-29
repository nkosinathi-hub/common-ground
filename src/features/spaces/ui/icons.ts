import {
  BookOpen,
  Cat,
  Coffee,
  Dog,
  Film,
  Flower2,
  Gamepad2,
  Heart,
  House,
  Leaf,
  Moon,
  Mountain,
  Music,
  Palette,
  Plane,
  Popcorn,
  Sparkles,
  Star,
  Sun,
  Tent,
  TreePine,
  Users,
} from "@lucide/svelte"
import type { SpaceIcon } from "../domain/profile"

/** The component for each allowed space icon key. */
const SPACE_ICON_COMPONENTS: Readonly<Record<SpaceIcon, typeof Heart>> = {
  heart: Heart,
  users: Users,
  house: House,
  sparkles: Sparkles,
  film: Film,
  popcorn: Popcorn,
  coffee: Coffee,
  leaf: Leaf,
  "tree-pine": TreePine,
  sun: Sun,
  moon: Moon,
  star: Star,
  music: Music,
  "book-open": BookOpen,
  palette: Palette,
  mountain: Mountain,
  plane: Plane,
  tent: Tent,
  "gamepad-2": Gamepad2,
  dog: Dog,
  cat: Cat,
  "flower-2": Flower2,
}

export const iconFor = (key: string | null) =>
  key && key in SPACE_ICON_COMPONENTS ? SPACE_ICON_COMPONENTS[key as SpaceIcon] : null
