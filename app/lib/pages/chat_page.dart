import 'package:flutter/material.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';

class ChatPage extends StatefulWidget {
  final String circleId;
  const ChatPage({super.key, required this.circleId});
  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _api = ApiService();
  final _socket = SocketService();
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<Map<String, dynamic>> _messages = [];
  Map<String, dynamic>? _circle;
  Map<String, dynamic>? _systemEvent;
  bool _connected = false;

  final _quickEmojis = ['👍', '😊', '🔥', '❤️', '😂', '🙏'];
  final _quickPhrases = ['我在路上', '我到了', '还有位置吗', '+1'];

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _socket.connect();
    _socket.joinCircle(widget.circleId);
    _socket.socket.on('new_msg', (data) {
      if (mounted)
        setState(() =>
            _messages.add(Map<String, dynamic>.from(data)));
      _scrollToBottom();
    });
    _socket.socket.on('msg_ack', (data) {
      final idx = _messages
          .indexWhere((m) => m['client_id'] == data['client_id']);
      if (idx >= 0)
        setState(() => _messages[idx]['id'] = data['msg_id']);
    });
    _socket.socket.on('system', (data) {
      if (mounted)
        setState(() =>
            _systemEvent = Map<String, dynamic>.from(data));
    });
    _socket.socket.on('msg_recalled', (data) {
      final msgId = data['msg_id'];
      if (mounted)
        setState(() {
          final idx =
              _messages.indexWhere((m) => m['id'] == msgId);
          if (idx >= 0)
            _messages[idx]['recall_snapshot'] =
                data['recall_snapshot'];
        });
    });
    _socket.socket.on('muted', (data) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('你已被禁言至 ${data['until']}')),
        );
    });
    _socket.socket.on('error', (data) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(data['message'] ?? '发送失败'),
              backgroundColor: Colors.red),
        );
    });
    _socket.socket
        .onConnect((_) => setState(() => _connected = true));
    _socket.socket
        .onDisconnect((_) => setState(() => _connected = false));

    final circleRes =
        await _api.get('/circles/${widget.circleId}');
    _circle = circleRes.data['data'];
    final msgRes = await _api
        .get('/circles/${widget.circleId}/messages');
    setState(() => _messages = List<Map<String, dynamic>>.from(
        msgRes.data['data'] ?? []));
    _scrollToBottom(animate: false);
  }

  void _sendMessage(String content) {
    if (content.trim().isEmpty) return;
    final clientId =
        '${DateTime.now().millisecondsSinceEpoch}';
    _socket.sendMessage(widget.circleId, content, clientId);
    setState(() => _messages.add({
          'client_id': clientId,
          'content': content,
          'type': 'text',
          'user_id': 'me',
          'created_at': DateTime.now().toIso8601String(),
        }));
    _msgCtrl.clear();
    _scrollToBottom();
  }

  void _scrollToBottom({bool animate = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
            _scrollCtrl.position.maxScrollExtent,
            duration: Duration(
                milliseconds: animate ? 300 : 0),
            curve: Curves.easeOut);
      }
    });
  }

  @override
  void dispose() {
    _socket.disconnect();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  bool get _isCircleEnded =>
      _circle != null &&
      (_circle!['status'] == 'archived' ||
          _circle!['status'] == 'dissolved');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_circle?['title'] ?? '聊天'),
        actions: [
          if (!_connected)
            const Padding(
                padding: EdgeInsets.only(right: 8),
                child: Icon(Icons.cloud_off, color: Colors.red)),
        ],
      ),
      body: Column(children: [
        if (_isCircleEnded)
          Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: Colors.grey[200],
              child: const Text('圈子已结束',
                  textAlign: TextAlign.center)),
        Expanded(
            child: ListView.builder(
          controller: _scrollCtrl,
          padding: const EdgeInsets.all(16),
          itemCount: _messages.length,
          itemBuilder: (_, i) {
            final msg = _messages[i];
            final isMe = msg['user_id'] == 'me';
            final isSystem = msg['type'] == 'system';
            if (isSystem) {
              return Center(
                  child: Padding(
                padding: const EdgeInsets.all(8),
                child: Text(msg['content'] ?? '',
                    style: const TextStyle(
                        color: Colors.grey, fontSize: 12)),
              ));
            }
            return Align(
              alignment: isMe
                  ? Alignment.centerRight
                  : Alignment.centerLeft,
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isMe ? Colors.orange : Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: msg['type'] == 'image'
                    ? Image.network(msg['image_url'] ?? '',
                        width: 200, fit: BoxFit.cover)
                    : Text(msg['content'] ?? ''),
              ),
            );
          },
        )),
        SizedBox(
            height: 40,
            child: Row(children: [
              ..._quickEmojis.map((e) => GestureDetector(
                    onTap: () => _sendMessage(e),
                    child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6),
                        child: Text(e,
                            style: const TextStyle(
                                fontSize: 22))),
                  )),
              const VerticalDivider(),
              ..._quickPhrases.map((p) => GestureDetector(
                    onTap: () => _sendMessage(p),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6),
                      child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                              border: Border.all(
                                  color:
                                      Colors.grey[300]!),
                              borderRadius:
                                  BorderRadius.circular(
                                      12)),
                          child: Text(p,
                              style: const TextStyle(
                                  fontSize: 12))),
                    ),
                  )),
            ])),
        if (!_isCircleEnded)
          SafeArea(
              child: Padding(
            padding: const EdgeInsets.all(8),
            child: Row(children: [
              Expanded(
                  child: TextField(
                      controller: _msgCtrl,
                      decoration: const InputDecoration(
                          hintText: '输入消息...',
                          border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              IconButton(
                  onPressed: () =>
                      _sendMessage(_msgCtrl.text),
                  icon: const Icon(Icons.send,
                      color: Colors.orange)),
            ]),
          )),
      ]),
    );
  }
}
