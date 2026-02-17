import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models.dart';
import 'dart:io';

class ApiService {
  static const String baseUrl = 'http://192.168.10.169:3000/api';
  final _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<PaginatedResponse<Folder>> getFolders({int page = 1, int limit = 20, String? search}) async {
    final headers = await _getHeaders();
    String url = '$baseUrl/folders?page=$page&limit=$limit';
    if (search != null) {
      url += '&search=${Uri.encodeComponent(search)}';
    }
    
    final response = await http.get(
      Uri.parse(url),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final jsonResponse = json.decode(response.body);
      final List data = jsonResponse['data'];
      final pagination = Pagination.fromJson(jsonResponse['pagination']);
      
      return PaginatedResponse(
        data: data.map((folder) => Folder.fromJson(folder)).toList(),
        pagination: pagination,
      );
    } else {
      throw Exception('Failed to load folders');
    }
  }

  Future<PaginatedResponse<Media>> getMedia({String? folderId, int page = 1, int limit = 20, String? search}) async {
    String url = '$baseUrl/media?page=$page&limit=$limit';
    if (folderId != null) {
      url += '&folderIds=$folderId';
    }
    if (search != null) {
      url += '&search=${Uri.encodeComponent(search)}';
    }
    
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse(url), headers: headers);

    if (response.statusCode == 200) {
      final jsonResponse = json.decode(response.body);
      final List data = jsonResponse['data'];
      final pagination = Pagination.fromJson(jsonResponse['pagination']);

      return PaginatedResponse(
        data: data.map((media) => Media.fromJson(media)).toList(),
        pagination: pagination,
      );
    } else {
      throw Exception('Failed to load media');
    }
  }

  Future<AnalyticsResponse> getAnalytics() async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/analytics'), headers: headers);

    if (response.statusCode == 200) {
      return AnalyticsResponse.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load analytics');
    }
  }

  Future<void> deleteMedia(String id) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/media/$id'),
      headers: headers,
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete media');
    }
  }

  Future<void> updateMedia(String id, Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/media/$id'),
      headers: headers,
      body: json.encode(data),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update media');
    }
  }

  /// Step 1: Upload the file to storage
  Future<Map<String, dynamic>> uploadFile(File file, {String? fileName}) async {
    final token = await _storage.read(key: 'token');
    final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload'));

    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    request.files.add(await http.MultipartFile.fromPath('file', file.path));
    if (fileName != null) {
      request.fields['fileName'] = fileName;
    }
    request.fields['fileType'] = file.path.toLowerCase().endsWith('.mp4') || 
                                 file.path.toLowerCase().endsWith('.mov') ||
                                 file.path.toLowerCase().endsWith('.avi') ? 'video' : 'image';

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body)['error'] ?? 'Upload failed';
      throw Exception(error);
    }
  }

  /// Step 2: Create the media entry in the database
  Future<void> createMediaEntry(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/media'),
      headers: headers,
      body: json.encode(data),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      final error = json.decode(response.body)['error'] ?? 'Failed to create media entry';
      throw Exception(error);
    }
  }

  Future<void> uploadThumbnail(String mediaId, File imageFile) async {
    final token = await _storage.read(key: 'token');
    final request = http.MultipartRequest(
      'PATCH',
      Uri.parse('$baseUrl/media/$mediaId/thumbnail'),
    );

    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    request.files.add(
      await http.MultipartFile.fromPath(
        'thumbnail',
        imageFile.path,
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 200) {
      final error = json.decode(response.body)['error'] ?? 'Upload failed';
      throw Exception(error);
    }
  }

  Future<void> createFolder(Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/folders'),
      headers: headers,
      body: json.encode(data),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      final error = json.decode(response.body)['error'] ?? 'Failed to create folder';
      throw Exception(error);
    }
  }

  Future<void> deleteFolder(String id) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/folders/$id'),
      headers: headers,
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete folder');
    }
  }

  Future<void> updateFolder(String id, Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/folders/$id'),
      headers: headers,
      body: json.encode(data),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update folder');
    }
  }
}
