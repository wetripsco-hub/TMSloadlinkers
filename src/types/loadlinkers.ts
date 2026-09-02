export interface NavSubItem {
  title: string;
  href: string;
  description?: string;
  icon?: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavSubItem[];
}

export interface MegaMenuConfig {
  columns: NavSection[];
  featuredCard?: {
    title: string;
    description: string;
    imageSrc: string;
    href: string;
    badgeText?: string;
  };
}

export interface SolutionCard {
  id: string;
  title: string;
  description: string;
  href: string;
  bgImage: string;
  ariaLabel: string;
}

export interface FeatureRow {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}

export interface PartnerLogo {
  name: string;
  imageSrc: string;
  href: string;
}

export interface ApplicationItem {
  id: string;
  title: string;
  description: string;
  href: string;
  iconName: "inventory" | "orders" | "shipments" | "scheduler" | "analytics" | "driver" | "integrations";
}

export interface ArticleItem {
  id: string;
  category: string;
  categoryHref: string;
  title: string;
  excerpt: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
}
