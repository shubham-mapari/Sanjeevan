export type RichDocument = {
  type: "doc";
  content?: RichNode[];
};

export type RichNode = {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
  text?: string;
  marks?: { type: string; attrs?: Record<string, string> }[];
  content?: RichNode[];
};

export type GalleryImageItem = {
  id?: string;
  page_id?: string;
  image_url: string;
  sort_order: number;
};

export type PageFileItem = {
  id?: string;
  page_id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
};

export type NavigationPage = {
  id: string;
  menu_item_id: string | null;
  title: string;
  slug: string;
  hero_image: string | null;
  hero_heading?: string | null;
  hero_subtitle?: string | null;
  description: RichDocument;
  gallery: string[];
  gallery_images?: GalleryImageItem[];
  pdf_file: string | null;
  page_files?: PageFileItem[];
  video_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type NavigationItem = {
  id: string;
  menu_id: string;
  parent_id: string | null;
  level: number;
  icon: string | null;
  title: string;
  slug: string;
  sort_order: number;
  is_visible: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  page?: NavigationPage | null;
  children: NavigationItem[];
};

export type NavigationMenu = {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  items: NavigationItem[];
};

export type MenuInput = Pick<
  NavigationMenu,
  "title" | "slug" | "icon" | "sort_order" | "is_visible" | "is_published"
>;
export type MenuItemInput = Pick<
  NavigationItem,
  "menu_id" | "title" | "slug" | "sort_order" | "is_visible" | "is_published"
> & {
  parent_id?: string | null;
  level?: number;
  icon?: string | null;
};
export type PageInput = Omit<
  NavigationPage,
  "id" | "created_at" | "updated_at"
>;
