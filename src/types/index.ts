export interface Folder {
  id: string;
  name: string;
  description?: string | null;
  tags: string[];
  productCategory?: string | null;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
  _count?: {
    media: number;
  };
}

export interface Media {
  id: string;
  folderId: string;
  fileName: string;
  fileType: "image" | "video";
  fileFormat: string;
  fileSize: number;
  storagePath: string;
  cdnUrl: string;
  thumbnailUrl?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  folder?: Folder;
  metadata?: any;
}
