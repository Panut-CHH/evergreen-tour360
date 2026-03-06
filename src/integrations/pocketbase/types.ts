export interface Tour {
  id: string;
  title: string;
  description: string;
  image: string; // filename stored by PocketBase
  slug: string;
  is_active: boolean;
  view_count: number;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}
