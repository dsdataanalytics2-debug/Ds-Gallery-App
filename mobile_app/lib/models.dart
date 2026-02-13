class Folder {
  final String id;
  final String name;
  final String? description;
  final List<String> tags;
  final String? productCategory;
  final DateTime createdAt;
  final int mediaCount;

  Folder({
    required this.id,
    required this.name,
    this.description,
    required this.tags,
    this.productCategory,
    required this.createdAt,
    required this.mediaCount,
  });

  factory Folder.fromJson(Map<String, dynamic> json) {
    return Folder(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      tags: List<String>.from(json['tags'] ?? []),
      productCategory: json['productCategory'],
      createdAt: DateTime.parse(json['createdAt']),
      mediaCount: json['_count']?['media'] ?? 0,
    );
  }
}

class Media {
  final String id;
  final String folderId;
  final String fileName;
  final String fileType;
  final String fileFormat;
  final int fileSize;
  final String cdnUrl;
  final String? thumbnailUrl;
  final List<String> tags;
  final DateTime createdAt;

  Media({
    required this.id,
    required this.folderId,
    required this.fileName,
    required this.fileType,
    required this.fileFormat,
    required this.fileSize,
    required this.cdnUrl,
    this.thumbnailUrl,
    required this.tags,
    required this.createdAt,
  });

  factory Media.fromJson(Map<String, dynamic> json) {
    return Media(
      id: json['id'],
      folderId: json['folderId'],
      fileName: json['fileName'],
      fileType: json['fileType'],
      fileFormat: json['fileFormat'],
      fileSize: json['fileSize'],
      cdnUrl: json['cdnUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      tags: List<String>.from(json['tags'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
