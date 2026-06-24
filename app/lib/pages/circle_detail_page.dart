import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';

class CircleDetailPage extends StatefulWidget {
  final String circleId;
  const CircleDetailPage({super.key, required this.circleId});
  @override
  State<CircleDetailPage> createState() => _CircleDetailPageState();
}

class _CircleDetailPageState extends State<CircleDetailPage> {
  final _api = ApiService();
  Map<String, dynamic>? _circle;
  List<Map<String, dynamic>> _members = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final circleRes =
        await _api.get('/circles/${widget.circleId}');
    final membersRes =
        await _api.get('/circles/${widget.circleId}/members');
    setState(() {
      _circle = circleRes.data['data'];
      _members = List<Map<String, dynamic>>.from(
          membersRes.data['data'] ?? []);
      _loading = false;
    });
  }

  Future<void> _joinCircle() async {
    await _api.post('/circles/${widget.circleId}/join');
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('加入成功')));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return Scaffold(
          appBar: AppBar(),
          body: const Center(child: CircularProgressIndicator()));
    if (_circle == null)
      return Scaffold(
          appBar: AppBar(),
          body: const Center(child: Text('圈子不存在')));

    final c = _circle!;
    return Scaffold(
      appBar: AppBar(title: Text(c['title'] ?? ''), actions: [
        IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => Share.share(
                  '🏀 ${c['title']}\n📍 ${c['address'] ?? "附近"}\n👥 ${c['member_count'] ?? 0}/${c['max_members']}人\n\n一起来玩！下载"一起拼"App → yiqipin.cn',
                  subject: c['title'],
                )),
      ]),
      body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
                child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text(c['title'] ?? '',
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight:
                                      FontWeight.bold)),
                          const SizedBox(height: 8),
                          _infoRow(
                              '分类', c['category_name'] ?? ''),
                          _infoRow('状态', c['status'] ?? ''),
                          _infoRow('人数',
                              '${c['member_count'] ?? 0}/${c['max_members']}人'),
                          if (c['prep_time'] > 0)
                            _infoRow('准备时间',
                                '${c['prep_time']}分钟'),
                          if (c['address'] != null)
                            _infoRow('地点', c['address']),
                          if (c['description'] != null) ...[
                            const SizedBox(height: 8),
                            Text(c['description'],
                                style: const TextStyle(
                                    color: Colors.grey)),
                          ],
                        ]))),
            const SizedBox(height: 16),
            const Text('成员',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...(_members.map((m) => ListTile(
                  leading: CircleAvatar(
                      backgroundImage: m['avatar'] != null
                          ? NetworkImage(m['avatar'])
                          : null,
                      child: m['avatar'] == null
                          ? const Icon(Icons.person)
                          : null),
                  title: Text(m['nickname'] ?? ''),
                  subtitle: Text(m['role'] == 'creator'
                      ? '创建者'
                      : '成员'),
                ))),
          ]),
      floatingActionButton: c['status'] == 'active' ||
              c['status'] == 'preparing'
          ? Column(mainAxisSize: MainAxisSize.min, children: [
              FloatingActionButton(
                  heroTag: 'join',
                  onPressed: _joinCircle,
                  child: const Icon(Icons.group_add)),
              const SizedBox(height: 8),
              FloatingActionButton(
                  heroTag: 'chat',
                  onPressed: () => Navigator.pushNamed(
                      context, '/chat',
                      arguments: widget.circleId),
                  child: const Icon(Icons.chat)),
            ])
          : null,
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(children: [
          Text('$label: ',
              style: const TextStyle(color: Colors.grey)),
          Text(value),
        ]));
  }
}
