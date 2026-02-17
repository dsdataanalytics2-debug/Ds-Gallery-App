export interface Folder {
  id: string;
  name: string;
  description?: string | null;
  tags: string[];
  productCategory?: string | null;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
  parentId?: string | null;
  parent?: Folder;
  children?: Folder[];
  ownerId?: string | null;
  owner?: { id: string; name: string | null; email: string };
  permissions?: {
    id: string;
    userId: string;
    user: { id: string; name: string | null; email: string; role: string };
  }[];
  _count?: {
    media: number;
  };
  // Production fields for folder card display
  imageCount?: number;
  videoCount?: number;
}

export interface Media {
  id: string;
  folderId: string;
  fileName: string;
  fileType: "image" | "video";
  fileFormat: string;
  fileSize: number;
  storagePath: string;
  storageType: string;
  publicId?: string | null;
  cdnUrl: string;
  thumbnailUrl?: string | null;
  isCustomThumbnail: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  folder?: Folder;
  metadata?: any;
}
