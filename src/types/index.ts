export interface Folder {
  id: string;
  name: string;
  description?: string | null;
  tags: string[];
  productCategory?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  media?: Media[];
  parentId?: string | null;
  parent?: Folder;
  children?: Folder[];
  ownerId?: string | null;
  owner?: { id: string; name: string | null; email: string };
  isPublic: boolean;
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
  fileType: string;
  fileFormat: string;
  fileSize: number;
  storagePath: string;
  storageType: string;
  storageFileId: string;
  googleAccountId?: string | null;
  publicId?: string | null;
  cdnUrl: string;
  thumbnailUrl?: string | null;
  isCustomThumbnail: boolean;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  folder?: Folder;
  metadata?: Record<string, unknown> | null;
}
