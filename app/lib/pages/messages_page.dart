import 'package:flutter/material.dart';
import '../services/api_service.dart';

class MessagesPage extends StatefulWidget {
  const MessagesPage({super.key});
  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  final _api = ApiService();
  List<Map<String, dynamic>> _activeCircles = [];
  List<Map<String, dynamic>> _endedCircles = [];
  bool _showEnded = false;

  @override
  void initState() {
    super.initState();
    _loadCircles();
  }

  Future<void> _loadCircles() async {
    final res = await _api.get('/users/me/circles');
    final circles = (res.data['data'] as List?)
            ?.map((j) => Map<String, dynamic>.from(j))
            .toList() ??
        [];

    setState(() {
      _activeCircles = circles
          .where((c) =>
              c['status'] == 'active' ||
              c['status'] == 'preparing' ||
              c['status'] == 'private_permanent')
          .toList();
      _endedCircles = circles
          .where((c) =>
              c['status'] == 'archived' ||
              c['status'] == 'dissolved')
          .toList();
    });
  }

  int _unreadCount(Map<String, dynamic> circle) {
    if (circle['status'] == 'ended') return 0;
    final lastRead = circle['last_read_at'] != null
        ? DateTime.parse(circle['last_read_at'])
        : DateTime(2000);
    final lastMsg = circle['last_message_at'] != null
        ? DateTime.parse(circle['last_message_at'])
        : DateTime(2000);
    return lastMsg.isAfter(lastRead) ? 1 : 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('消息')),
      body: ListView(children: [
        ..._activeCircles.map((c) => ListTile(
              leading: Badge(
                isLabelVisible: _unreadCount(c) > 0,
                child: CircleAvatar(
                  backgroundColor: Colors.orange[100],
                  child: const Icon(Icons.circle,
                      color: Colors.orange),
                ),
              ),
              title: Text(c['title'] ?? ''),
              subtitle: Text(c['last_message'] ?? ''),
              trailing: Text(
                  _timeLabel(c['last_message_at'] ?? '')),
              onTap: () => Navigator.pushNamed(
                  context, '/chat',
                  arguments: c['id']),
            )),
        if (_endedCircles.isNotEmpty)
          ListTile(
            leading: const Icon(Icons.expand_more),
            title: Text(
                '已结束的圈子 (${_endedCircles.length})'),
            trailing: Icon(_showEnded
                ? Icons.expand_less
                : Icons.expand_more),
            onTap: () =>
                setState(() => _showEnded = !_showEnded),
          ),
        if (_showEnded)
          ..._endedCircles.map((c) => ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.grey[300],
                  child: const Icon(Icons.archive,
                      color: Colors.grey),
                ),
                title: Text(c['title'] ?? '',
                    style: const TextStyle(
                        color: Colors.grey)),
                subtitle: Text('已结束',
                    style: const TextStyle(
                        color: Colors.grey)),
              )),
      ]),
    );
  }

  String _timeLabel(String dateStr) {
    if (dateStr.isEmpty) return '';
    final diff =
        DateTime.now().difference(DateTime.parse(dateStr));
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    return '${diff.inDays}天前';
  }
}
