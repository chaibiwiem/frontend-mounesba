import {
  IconSpeaker,
  IconLightbulb,
  IconSnowflake,
  IconFlame,
  IconBuilding,
  IconChair,
  IconTable,
  IconToilet,
  IconFlower,
  IconDroplet,
  IconWifi,
  IconCar,
  IconFlag,
  IconSparkles,
  IconTag,
  IconUtensils,
  IconCake,
  IconScissors,
  IconShirt,
  IconCamera,
  IconMusic,
  IconGift,
  IconConfetti,
  IconTree,
  IconUmbrella,
  IconMonitor,
  IconBed,
  IconBus,
} from '../components/icons';

// Palette d'icones proposee au prestataire pour ses equipements (dashboard,
// section "Plus d'informations"). Contrairement aux Types d'evenements
// (bandeau fixe identique partout), les equipements sont libres : le
// prestataire choisit une icone dans cette palette ET saisit son propre nom
// (ex: "Piscine", "Voiturier"...) - stockes tels quels dans listing.amenities
// (tableau de {icon, name}).
export const AMENITY_ICON_OPTIONS = [
  { key: 'speaker', label: 'Sonorisation', Icon: IconSpeaker },
  { key: 'lightbulb', label: 'Éclairage', Icon: IconLightbulb },
  { key: 'snowflake', label: 'Climatisation', Icon: IconSnowflake },
  { key: 'flame', label: 'Chauffage', Icon: IconFlame },
  { key: 'building', label: 'Restaurant', Icon: IconBuilding },
  { key: 'chair', label: 'Chaises / Mobilier', Icon: IconChair },
  { key: 'table', label: 'Tables', Icon: IconTable },
  { key: 'toilet', label: 'Toilettes', Icon: IconToilet },
  { key: 'flower', label: 'Décoration', Icon: IconFlower },
  { key: 'droplet', label: 'Savons / Hygiène', Icon: IconDroplet },
  { key: 'wifi', label: 'WiFi', Icon: IconWifi },
  { key: 'car', label: 'Parking', Icon: IconCar },
  { key: 'flag', label: 'Pancarte / Signalétique', Icon: IconFlag },
  { key: 'sparkles', label: 'Décor lumineux', Icon: IconSparkles },
  { key: 'tree', label: 'Jardin / Espace extérieur', Icon: IconTree },
  { key: 'umbrella', label: 'Piscine / Plein air', Icon: IconUmbrella },
  { key: 'bed', label: 'Hébergement / Suite', Icon: IconBed },
  { key: 'monitor', label: 'Écran / Vidéoprojecteur', Icon: IconMonitor },
  { key: 'utensils', label: 'Restauration / Repas', Icon: IconUtensils },
  { key: 'cake', label: 'Pièce montée / Buffet', Icon: IconCake },
  { key: 'scissors', label: 'Coiffure / Maquillage', Icon: IconScissors },
  { key: 'shirt', label: 'Cabine d’essayage', Icon: IconShirt },
  { key: 'camera', label: 'Photobooth / Coin photo', Icon: IconCamera },
  { key: 'music', label: 'DJ / Animation musicale', Icon: IconMusic },
  { key: 'confetti', label: 'Jeux / Animation', Icon: IconConfetti },
  { key: 'gift', label: 'Cadeaux invités', Icon: IconGift },
  { key: 'bus', label: 'Navette / Transport groupe', Icon: IconBus },
];

export const AMENITY_ICON_MAP = Object.fromEntries(
  AMENITY_ICON_OPTIONS.map((opt) => [opt.key, opt.Icon])
);

export const DEFAULT_AMENITY_ICON = IconTag;
