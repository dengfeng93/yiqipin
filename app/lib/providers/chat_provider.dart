import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';

class ChatState {
  final Map<String, List<Map<String, dynamic>>> messagesByCircle;
  final Map<String, bool> connectedStatus;
  final String? mutedCircleId;
  final String? mutedReason;
  final String? lastError;

  ChatState({
    this.messagesByCircle = const {},
    this.connectedStatus = const {},
    this.mutedCircleId,
    this.mutedReason,
    this.lastError,
  });

  ChatState copyWith({
    Map<String, List<Map<String, dynamic>>>? messagesByCircle,
    Map<String, bool>? connectedStatus,
    String? mutedCircleId,
    String? mutedReason,
    String? lastError,
    bool clearMuted = false,
    bool clearError = false,
  }) {
    return ChatState(
      messagesByCircle: messagesByCircle ?? this.messagesByCircle,
      connectedStatus: connectedStatus ?? this.connectedStatus,
      mutedCircleId:
          clearMuted ? null : (mutedCircleId ?? this.mutedCircleId),
      mutedReason: clearMuted ? null : (mutedReason ?? this.mutedReason),
      lastError: clearError ? null : (lastError ?? this.lastError),
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final _api = ApiService();
  final _socket = SocketService();
  bool _socketInitialized = false;

  ChatNotifier() : super(ChatState());

  Future<void> initSocket() async {
    if (_socketInitialized) return;
    await _socket.connect();

    _socket.socket.on('connect', (_) {
      state = state.copyWith(
        connectedStatus: {...state.connectedStatus, '': true},
      );
    });

    _socket.socket.on('disconnect', (_) {
      state = state.copyWith(
        connectedStatus: {...state.connectedStatus, '': false},
      );
    });

    _socket.socket.on('new_msg', (data) {
      final circleId = data['circle_id'] as String;
      final msgs = List<Map<String, dynamic>>.from(
          state.messagesByCircle[circleId] ?? []);
      msgs.add(Map<String, dynamic>.from(data));
      state = state.copyWith(
          messagesByCircle: {
            ...state.messagesByCircle,
            circleId: msgs
          });
    });
    _socket.socket.on('msg_ack', (data) {
      // match client_id with server msg_id
    });
    _socket.socket.on('system', (data) {
      // system events handled by UI layer
    });
    _socket.socket.on('msg_recalled', (data) {
      final msgId = data['msg_id'];
      final circleId = data['circle_id'] as String;
      final msgs = List<Map<String, dynamic>>.from(
          state.messagesByCircle[circleId] ?? []);
      final idx = msgs.indexWhere((m) => m['id'] == msgId);
      if (idx >= 0) {
        msgs[idx] = Map<String, dynamic>.from(msgs[idx])
          ..['recall_snapshot'] = data['recall_snapshot'];
        state = state.copyWith(
            messagesByCircle: {
              ...state.messagesByCircle,
              circleId: msgs
            });
      }
    });
    _socket.socket.on('muted', (data) {
      state = state.copyWith(
        mutedCircleId: data['circle_id'] as String,
        mutedReason: data['message'] ?? '你已被禁言',
      );
    });
    _socket.socket.on('error', (data) {
      state = state.copyWith(
          lastError: data['message'] ?? '发生错误');
    });
    _socketInitialized = true;
  }

  void joinCircle(String circleId) {
    _socket.joinCircle(circleId);
  }

  void sendMessage(String circleId, String content) {
    try {
      final clientId =
          '${DateTime.now().millisecondsSinceEpoch}';
      _socket.sendMessage(circleId, content, clientId);
      final msgs = List<Map<String, dynamic>>.from(
          state.messagesByCircle[circleId] ?? []);
      msgs.add({
        'client_id': clientId,
        'content': content,
        'type': 'text',
        'user_id': 'me',
        'created_at': DateTime.now().toIso8601String()
      });
      state = state.copyWith(
          messagesByCircle: {
            ...state.messagesByCircle,
            circleId: msgs
          });
    } catch (e) {
      state = state.copyWith(lastError: '发送失败: $e');
    }
  }

  Future<void> loadHistory(String circleId) async {
    try {
      final res =
          await _api.get('/circles/$circleId/messages');
      final msgs = List<Map<String, dynamic>>.from(
          res.data['data'] ?? []);
      state = state.copyWith(
          messagesByCircle: {
            ...state.messagesByCircle,
            circleId: msgs
          });
    } catch (e) {
      state = state.copyWith(lastError: '加载消息失败: $e');
    }
  }

  void disconnect() {
    _socket.disconnect();
    _socketInitialized = false;
  }
}

final chatProvider =
    StateNotifierProvider<ChatNotifier, ChatState>((ref) => ChatNotifier());
