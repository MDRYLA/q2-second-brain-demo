// Icon registry for nav modules.
// 8 modules x 4 options each (mix stoic Lucide + geometric/greek + alchemy + custom rzym SVG).

import type { ComponentType } from "react";
import {
  // Today
  Sun, Circle, Hexagon,
  // Check-in (rano)
  PenLine, Sunrise, Sparkles,
  // Check-out (wieczor)
  Moon, Flame, Sunset,
  // Konstytucja
  ScrollText, Scale, Building2,
  // O mnie teraz
  Compass, Eye, Mountain,
  // Pomysly
  Lightbulb, Wand, Zap,
  // Plan
  CalendarRange, Map, Telescope,
  // Historia
  History, Archive, BookOpen,
  // Silownia
  Dumbbell,
  // Wiedza
  Library,
  Quote,
  type LucideProps,
} from "lucide-react";

import {
  Klepsydra, Sowa, Kolumna, Lira, Maska, Mapa, Wieniec, Oliwa,
} from "@/components/icons/rzym";

export type IconComponent = ComponentType<LucideProps>;

export type ModuleSlug =
  | "today"
  | "checkin"
  | "checkout"
  | "konstytucja"
  | "omnie"
  | "pomysly"
  | "plan"
  | "historia"
  | "silownia"
  | "wiedza"
  | "cytaty";

export type IconFamily = "stoic" | "geometric" | "alchemy" | "rzym";

export interface IconOption {
  id: string;             // unique within module (e.g. "today-sun")
  Icon: IconComponent;
  label: string;          // krotki opis stylistyki
  family: IconFamily;
}

export interface ModuleIcons {
  slug: ModuleSlug;
  label: string;          // PL nazwa modulu w nav
  options: IconOption[];  // 4 propozycje (3 Lucide + 1 rzym)
  defaultId: string;      // domyslna opcja
}

export const MODULE_REGISTRY: ModuleIcons[] = [
  {
    slug: "today",
    label: "Dzisiaj",
    defaultId: "today-sun",
    options: [
      { id: "today-klepsydra", Icon: Klepsydra, label: "Klepsydra (rzym)",       family: "rzym" },
      { id: "today-sun",       Icon: Sun,       label: "Slonce (stoic)",         family: "stoic" },
      { id: "today-circle",    Icon: Circle,    label: "Krag (geom)",            family: "geometric" },
      { id: "today-hexagon",   Icon: Hexagon,   label: "Heksagon (alchemy)",     family: "alchemy" },
    ],
  },
  {
    slug: "checkin",
    label: "Check-in",
    defaultId: "checkin-pen",
    options: [
      { id: "checkin-lira",     Icon: Lira,     label: "Lira (rzym)",            family: "rzym" },
      { id: "checkin-pen",      Icon: PenLine,  label: "Pioro (stoic)",          family: "stoic" },
      { id: "checkin-sunrise",  Icon: Sunrise,  label: "Wschod (geom)",          family: "geometric" },
      { id: "checkin-sparkles", Icon: Sparkles, label: "Iskra (alchemy)",        family: "alchemy" },
    ],
  },
  {
    slug: "checkout",
    label: "Check-out",
    defaultId: "checkout-moon",
    options: [
      { id: "checkout-maska",  Icon: Maska,  label: "Maska teatralna (rzym)",    family: "rzym" },
      { id: "checkout-moon",   Icon: Moon,   label: "Ksiezyc (stoic)",           family: "stoic" },
      { id: "checkout-flame",  Icon: Flame,  label: "Swieca (geom)",             family: "geometric" },
      { id: "checkout-sunset", Icon: Sunset, label: "Zachod (alchemy)",          family: "alchemy" },
    ],
  },
  {
    slug: "konstytucja",
    label: "Konstytucja",
    defaultId: "konstytucja-scroll",
    options: [
      { id: "konstytucja-kolumna",  Icon: Kolumna,    label: "Kolumna doryjska (rzym)", family: "rzym" },
      { id: "konstytucja-scroll",   Icon: ScrollText, label: "Zwoj (stoic)",        family: "stoic" },
      { id: "konstytucja-scale",    Icon: Scale,      label: "Waga (geom)",         family: "geometric" },
      { id: "konstytucja-building", Icon: Building2,  label: "Swiatynia (alchemy)", family: "alchemy" },
    ],
  },
  {
    slug: "omnie",
    label: "O mnie",
    defaultId: "omnie-compass",
    options: [
      { id: "omnie-oliwa",    Icon: Oliwa,    label: "Galazka oliwna (rzym)",  family: "rzym" },
      { id: "omnie-compass",  Icon: Compass,  label: "Kompas (stoic)",         family: "stoic" },
      { id: "omnie-eye",      Icon: Eye,      label: "Oko (geom)",             family: "geometric" },
      { id: "omnie-mountain", Icon: Mountain, label: "Gora (alchemy)",         family: "alchemy" },
    ],
  },
  {
    slug: "pomysly",
    label: "Pomysly",
    defaultId: "pomysly-bulb",
    options: [
      { id: "pomysly-sowa", Icon: Sowa,      label: "Sowa Ateny (rzym)", family: "rzym" },
      { id: "pomysly-bulb", Icon: Lightbulb, label: "Zarowka (stoic)",   family: "stoic" },
      { id: "pomysly-zap",  Icon: Zap,       label: "Iskra (geom)",      family: "geometric" },
      { id: "pomysly-wand", Icon: Wand,      label: "Rozdzka (alchemy)", family: "alchemy" },
    ],
  },
  {
    slug: "plan",
    label: "Plan",
    defaultId: "plan-calendar",
    options: [
      { id: "plan-papirus",   Icon: Mapa,          label: "Papirus (rzym)",     family: "rzym" },
      { id: "plan-calendar",  Icon: CalendarRange, label: "Kalendarz (stoic)",  family: "stoic" },
      { id: "plan-map",       Icon: Map,           label: "Mapa (geom)",        family: "geometric" },
      { id: "plan-telescope", Icon: Telescope,     label: "Teleskop (alchemy)", family: "alchemy" },
    ],
  },
  {
    slug: "historia",
    label: "Historia",
    defaultId: "historia-history",
    options: [
      { id: "historia-wieniec", Icon: Wieniec,  label: "Wieniec laurowy (rzym)",   family: "rzym" },
      { id: "historia-history", Icon: History,  label: "Zegar (stoic)",            family: "stoic" },
      { id: "historia-archive", Icon: Archive,  label: "Archiwum (geom)",          family: "geometric" },
      { id: "historia-book",    Icon: BookOpen, label: "Ksiega (alchemy)",         family: "alchemy" },
    ],
  },
  {
    slug: "silownia",
    label: "Siłownia",
    defaultId: "silownia-dumbbell",
    options: [
      { id: "silownia-dumbbell", Icon: Dumbbell, label: "Hantle (lucide)",         family: "stoic" },
    ],
  },
  {
    slug: "wiedza",
    label: "Wiedza",
    defaultId: "wiedza-library",
    options: [
      { id: "wiedza-library", Icon: Library, label: "Biblioteka (lucide)",        family: "stoic" },
    ],
  },
  {
    slug: "cytaty",
    label: "Cytaty",
    defaultId: "cytaty-quote",
    options: [
      { id: "cytaty-quote", Icon: Quote, label: "Cudzyslow (lucide)",             family: "stoic" },
    ],
  },
];

export type IconChoiceMap = Partial<Record<ModuleSlug, string>>;

export function getIconForModule(
  slug: ModuleSlug,
  choices: IconChoiceMap
): IconComponent {
  const module = MODULE_REGISTRY.find((m) => m.slug === slug);
  if (!module) return Sun;
  const chosenId = choices[slug] ?? module.defaultId;
  const opt = module.options.find((o) => o.id === chosenId) ?? module.options[0];
  return opt.Icon;
}
