import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';

class AuthState {
  final bool isLoggedIn;
  final Map<String, dynamic>? user;
  AuthState({this.isLoggedIn = false, this.user});
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _api = ApiService();
  final _storage = const FlutterSecureStorage();

  AuthNotifier() : super(AuthState());

  Future<void> wechatLogin(String code) async {
    final res = await _api.post('/auth/wechat-login', data: {'code': code});
    final data = res.data['data'];
    await _storage.write(key: 'access_token', value: data['accessToken']);
    await _storage.write(key: 'refresh_token', value: data['refreshToken']);
    state = AuthState(isLoggedIn: true, user: data['user']);
  }

  Future<void> login() async {
    // Try WeChat login flow; placeholder for now
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      try {
        final res = await _api.get('/auth/me');
        state = AuthState(isLoggedIn: true, user: res.data['data']);
        return;
      } catch (_) {
        // Token expired, try refresh
        final refreshed = await refreshToken();
        if (refreshed) return;
        await _storage.deleteAll();
      }
    }
    // Not logged in — caller should navigate to WeChat login
    state = AuthState();
  }

  Future<bool> refreshToken() async {
    final rt = await _storage.read(key: 'refresh_token');
    if (rt == null) return false;
    try {
      final res = await _api.post('/auth/refresh', data: {'refreshToken': rt});
      final data = res.data['data'];
      await _storage.write(key: 'access_token', value: data['accessToken']);
      await _storage.write(key: 'refresh_token', value: data['refreshToken']);
      try {
        final me = await _api.get('/auth/me');
        state = AuthState(isLoggedIn: true, user: me.data['data']);
      } catch (_) {
        state = AuthState(isLoggedIn: true);
      }
      return true;
    } catch (_) {
      await _storage.deleteAll();
      state = AuthState();
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    state = AuthState();
  }

  Future<void> checkAuth() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      try {
        final res = await _api.get('/auth/me');
        state = AuthState(isLoggedIn: true, user: res.data['data']);
      } catch (_) {
        // Try refresh
        final ok = await refreshToken();
        if (!ok) {
          await _storage.deleteAll();
          state = AuthState();
        }
      }
    }
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
