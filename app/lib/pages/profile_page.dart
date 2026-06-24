import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});
  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  final _api = ApiService();
  Map<String, dynamic>? _stats;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final res = await _api.get('/users/me');
      setState(() => _stats = res.data['data']);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('我的')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Center(
            child: Column(children: [
          CircleAvatar(
              radius: 40,
              backgroundImage: user?['avatar'] != null
                  ? NetworkImage(user!['avatar'])
                  : null,
              child: user?['avatar'] == null
                  ? const Icon(Icons.person, size: 40)
                  : null),
          const SizedBox(height: 12),
          Text(user?['nickname'] ?? '未命名',
              style: const TextStyle(
                  fontSize: 20, fontWeight: FontWeight.bold)),
        ])),
        const SizedBox(height: 24),
        Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _statCard('发起', '${_stats?['total_created'] ?? 0}'),
              _statCard('参与', '${_stats?['total_joined'] ?? 0}'),
              _statCard(
                  '到场率',
                  _stats?['showup_rate'] != null
                      ? "${(_stats!['showup_rate'] as num * 100).toStringAsFixed(0)}%"
                      : '-'),
            ]),
        const SizedBox(height: 24),
        _menuItem(Icons.circle, '我的圈子', () {}),
        _menuItem(Icons.star, '评价记录', () {}),
        _menuItem(Icons.settings, '设置',
            () => Navigator.pushNamed(context, '/settings')),
        const Divider(),
        _menuItem(Icons.logout, '退出登录',
            () => ref.read(authProvider.notifier).logout()),
      ]),
    );
  }

  Widget _statCard(String label, String value) {
    return Column(children: [
      Text(value,
          style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.orange)),
      Text(label, style: const TextStyle(color: Colors.grey)),
    ]);
  }

  Widget _menuItem(
      IconData icon, String title, VoidCallback onTap) {
    return ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap);
  }
}
