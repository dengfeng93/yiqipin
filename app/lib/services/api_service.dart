import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class ApiService {
  static ApiService? _instance;
  factory ApiService() => _instance ??= ApiService._internal();

  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  bool _isRefreshing = false;
  final _refreshQueue = <Completer<String?>>[];

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      responseType: ResponseType.json,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final newToken = await _refreshAccessToken();
          if (newToken != null) {
            error.requestOptions.headers['Authorization'] =
                'Bearer $newToken';
            final retryResponse = await _dio.fetch(error.requestOptions);
            return handler.resolve(retryResponse);
          }
          await _storage.deleteAll();
        }
        handler.next(error);
      },
    ));
  }

  Future<String?> _refreshAccessToken() async {
    if (_isRefreshing) {
      final completer = Completer<String?>();
      _refreshQueue.add(completer);
      return completer.future;
    }
    _isRefreshing = true;
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return null;
      final res = await Dio(BaseOptions(baseUrl: ApiConfig.baseUrl))
          .post('/auth/refresh', data: {'refreshToken': refreshToken});
      final newToken = res.data['data']['accessToken'] as String;
      final newRefresh = res.data['data']['refreshToken'] as String;
      await _storage.write(key: 'access_token', value: newToken);
      await _storage.write(key: 'refresh_token', value: newRefresh);
      for (final c in _refreshQueue) {
        c.complete(newToken);
      }
      _refreshQueue.clear();
      return newToken;
    } catch (_) {
      for (final c in _refreshQueue) {
        c.complete(null);
      }
      _refreshQueue.clear();
      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  Future<Response> get(String path, {Map<String, dynamic>? params}) =>
      _dio.get(path, queryParameters: params);

  Future<Response> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);

  Future<Response> patch(String path, {dynamic data}) =>
      _dio.patch(path, data: data);

  Future<Response> delete(String path) => _dio.delete(path);
}
