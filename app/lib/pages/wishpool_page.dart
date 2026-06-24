import 'package:flutter/material.dart';
import '../services/api_service.dart';

class WishpoolPage extends StatefulWidget {
  const WishpoolPage({super.key});
  @override
  State<WishpoolPage> createState() => _WishpoolPageState();
}

class _WishpoolPageState extends State<WishpoolPage> {
  final _api = ApiService();
  List<Map<String, dynamic>> _wishes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadWishes();
  }

  Future<void> _loadWishes() async {
    try {
      final res =
          await _api.get('/wishes', params: {'status': 'waiting'});
      if (mounted)
        setState(() {
          _wishes = List<Map<String, dynamic>>.from(
              res.data['data'] ?? []);
          _loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _joinWish(String wishId) async {
    await _api.post('/wishes/$wishId/join');
    _loadWishes();
  }

  String _timeLabel(String createdAt) {
    final diff =
        DateTime.now().difference(DateTime.parse(createdAt));
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    return '${diff.inDays}天前';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar:
          AppBar(title: const Text('心愿池'), centerTitle: true),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _wishes.isEmpty
              ? const Center(
                  child: Text('暂无心愿，快来发起吧！',
                      style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  onRefresh: _loadWishes,
                  child: ListView.builder(
                    itemCount: _wishes.length,
                    padding: const EdgeInsets.all(12),
                    itemBuilder: (_, i) {
                      final w = _wishes[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(w['title'] ?? ''),
                          subtitle: Text(
                              '已有 ${w['wish_count'] ?? 0}/${w['threshold'] ?? 3} 人响应 · ${_timeLabel(w['created_at'] ?? '')}'),
                          trailing: FilledButton(
                            onPressed: () => _joinWish(w['id']),
                            child: const Text('我也想去'),
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () =>
            Navigator.pushNamed(context, '/create-circle'),
        label: const Text('发起心愿'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}
