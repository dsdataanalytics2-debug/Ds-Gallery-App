import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  final _storage = const FlutterSecureStorage();

  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _storage.write(key: 'token', value: data['token']);
        await _storage.write(key: 'user', value: jsonEncode(data['user']));
        return data;
      }
      return null;
    } catch (e) {
      print('Login error: $e');
      return null;
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'token');
    await _storage.delete(key: 'user');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'token');
  }

  Future<Map<String, dynamic>?> getUser() async {
    String? userStr = await _storage.read(key: 'user');
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }
}
