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
    String cdnUrl = json['cdnUrl'] ?? '';
    String? thumbnailUrl = json['thumbnailUrl'];

    if (cdnUrl.startsWith('/')) {
      cdnUrl = 'http://192.168.10.169:3000$cdnUrl';
    }
    if (thumbnailUrl != null && thumbnailUrl.startsWith('/')) {
      thumbnailUrl = 'http://192.168.10.169:3000$thumbnailUrl';
    }

    return Media(
      id: json['id'],
      folderId: json['folderId'],
      fileName: json['fileName'],
      fileType: json['fileType'],
      fileFormat: json['fileFormat'],
      fileSize: json['fileSize'],
      cdnUrl: cdnUrl,
      thumbnailUrl: thumbnailUrl,
      tags: List<String>.from(json['tags'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class Pagination {
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  Pagination({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      total: json['total'],
      page: json['page'],
      limit: json['limit'],
      totalPages: json['totalPages'],
    );
  }
}

class PaginatedResponse<T> {
  final List<T> data;
  final Pagination pagination;

  PaginatedResponse({
    required this.data,
    required this.pagination,
  });
}

class AnalyticsSummary {
  final int totalMedia;
  final int imageCount;
  final int videoCount;
  final int totalSizeBytes;
  final String growthRate;

  AnalyticsSummary({
    required this.totalMedia,
    required this.imageCount,
    required this.videoCount,
    required this.totalSizeBytes,
    required this.growthRate,
  });

  factory AnalyticsSummary.fromJson(Map<String, dynamic> json) {
    return AnalyticsSummary(
      totalMedia: json['totalMedia'] ?? 0,
      imageCount: json['imageCount'] ?? 0,
      videoCount: json['videoCount'] ?? 0,
      totalSizeBytes: json['totalSizeBytes'] ?? 0,
      growthRate: json['growthRate']?.toString() ?? "0",
    );
  }
}

class AnalyticsResponse {
  final AnalyticsSummary summary;
  final List<Media> recentActivity;
  final List<dynamic> folderDistribution;

  AnalyticsResponse({
    required this.summary,
    required this.recentActivity,
    required this.folderDistribution,
  });

  factory AnalyticsResponse.fromJson(Map<String, dynamic> json) {
    return AnalyticsResponse(
      summary: AnalyticsSummary.fromJson(json['summary']),
      recentActivity: (json['recentActivity'] as List)
          .map((item) => Media.fromJson(item))
          .toList(),
      folderDistribution: json['folderDistribution'] ?? [],
    );
  }
}
