export const ICON_LIBRARY = {
  RomanceMilestones: {
    label: "💍 Romance & Milestones",
    icons: ["Heart","Sparkles","Gift","Cake","Crown","Flame","Smile","GlassWater","Wine","Music"],
  },
  TravelEvents: {
    label: "✈️ Travel & Experience",
    icons: ["Plane","MapPin","Camera","Compass","Calendar","Clock","Suitcase","Globe","Car","Ship"],
  },
  DesignShapes: {
    label: "🎨 Art & Geometry",
    icons: ["Circle","Square","Triangle","Hexagon","Pentagon","Star","Layers","Palette","PenTool","Brush"],
  },
  InterfaceEssentials: {
    label: "✨ Interface Essentials",
    icons: ["Sun","Moon","Image","Type","Link","FileText","Settings","Info","CheckCircle","AlertCircle"],
  },
} as const;

export type IconCategoryKey = keyof typeof ICON_LIBRARY;
