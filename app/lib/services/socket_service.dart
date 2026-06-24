import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class SocketService {
  io.Socket? _socket;

  io.Socket get socket {
    if (_socket == null) throw StateError('Socket not connected. Call connect() first.');
    return _socket!;
  }

  final _storage = const FlutterSecureStorage();
  final Map<String, DateTime> _lastSeen = {};

  Future<void> connect() async {
    final token = await _storage.read(key: 'access_token');
    _socket = io.io(
        ApiConfig.wsUrl,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .setQuery({'token': token})
            .build());

    _socket!.onConnect((_) {
      for (final entry in _lastSeen.entries) {
        _socket!.emit('pull_offline_msg', {
          'circle_id': entry.key,
          'since': entry.value.toIso8601String(),
        });
      }
    });
    _socket!.onDisconnect((_) => print('WS disconnected'));
  }

  void joinCircle(String circleId) {
    socket.emit('join_room', {'circle_id': circleId});
    _lastSeen[circleId] = DateTime.now();
  }

  void trackLastSeen(String circleId, DateTime time) {
    final existing = _lastSeen[circleId];
    if (existing == null || time.isAfter(existing)) {
      _lastSeen[circleId] = time;
    }
  }

  void sendMessage(String circleId, String content, String clientId) {
    socket.emit('send_msg', {
      'circle_id': circleId,
      'type': 'text',
      'content': content,
      'client_id': clientId,
    });
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}
