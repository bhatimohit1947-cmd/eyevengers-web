export interface Page {
  id: string;
  slug: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  status: 'draft' | 'published';
  publishAt?: string | null;
  unpublishAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SectionType = 
  | 'hero_banner'
  | 'promo_slider'
  | 'secondary_banner'
  | 'category_rail'
  | 'media_slider'
  | 'poster_slider'
  | 'specials_grid'
  | 'spotlight'
  | 'guide_slider'
  | 'collection_grid'
  | 'social_store';

export interface SectionInstance {
  id: string;
  pageId: string;
  sectionType: SectionType;
  configJson: any; // The payload specific to the component
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  uploadedAt: string;
  usedInSections?: string[];
}
