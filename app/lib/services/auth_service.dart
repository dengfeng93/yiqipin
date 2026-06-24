import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api;
  final _storage = const FlutterSecureStorage();

  AuthService(this._api);

  Future<Map<String, dynamic>> wechatLogin(String code) async {
    final res = await _api.post('/auth/wechat-login', data: {'code': code});
    final data = res.data['data'];
    await _storage.write(key: 'access_token', value: data['accessToken']);
    await _storage.write(key: 'refresh_token', value: data['refreshToken']);
    return data;
  }

  Future<Map<String, dynamic>?> getProfile() async {
    final res = await _api.get('/auth/me');
    return res.data['data'] as Map<String, dynamic>?;
  }

  Future<Map<String, dynamic>?> refreshToken() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return null;
    try {
      final res = await _api.post('/auth/refresh', data: {'refreshToken': refreshToken});
      final data = res.data['data'];
      await _storage.write(key: 'access_token', value: data['accessToken']);
      await _storage.write(key: 'refresh_token', value: data['refreshToken']);
      return data;
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'access_token');
    return token != null;
  }
}
