import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  final _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<List<Folder>> getFolders() async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/folders'), headers: headers);

    if (response.statusCode == 200) {
      List jsonResponse = json.decode(response.body);
      return jsonResponse.map((folder) => Folder.fromJson(folder)).toList();
    } else {
      throw Exception('Failed to load folders');
    }
  }

  Future<List<Media>> getMedia({String? folderId}) async {
    String url = '$baseUrl/media';
    if (folderId != null) {
      url += '?folderIds=$folderId';
    }
    
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse(url), headers: headers);

    if (response.statusCode == 200) {
      List jsonResponse = json.decode(response.body);
      return jsonResponse.map((media) => Media.fromJson(media)).toList();
    } else {
      throw Exception('Failed to load media');
    }
  }
}
