import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/error_state.dart';

class WishpoolPage extends StatefulWidget {
  const WishpoolPage({super.key});
  @override
  State<WishpoolPage> createState() => _WishpoolPageState();
}

class _WishpoolPageState extends State<WishpoolPage> {
  final _api = ApiService();
  List<Map<String, dynamic>> _wishes = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadWishes();
  }

  Future<void> _loadWishes() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await _api.get('/wishes', params: {'status': 'waiting'});
      if (mounted) {
        setState(() {
          _wishes = List<Map<String, dynamic>>.from(res.data['data'] ?? []);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = '加载失败'; });
    }
  }

  Future<void> _joinWish(String wishId) async {
    try {
      await _api.post('/wishes/$wishId/join');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('响应成功'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('操作失败'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating),
        );
      }
      return;
    }
    _loadWishes();
  }

  String _timeLabel(String createdAt) {
    try {
      final diff = DateTime.now().difference(DateTime.parse(createdAt));
      if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
      if (diff.inHours < 24) return '${diff.inHours}小时前';
      return '${diff.inDays}天前';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('心愿池')),
      body: _loading
          ? const SkeletonList(count: 4)
          : _error != null
              ? Center(child: ErrorStateWidget(message: _error!, onRetry: _loadWishes))
              : _wishes.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.favorite_border, size: 64, color: cs.onSurface.withOpacity(0.2)),
                      const SizedBox(height: AppSpacing.lg),
                      Text('暂无心愿', style: ts.titleMedium?.copyWith(color: cs.onSurfaceVariant)),
                      const SizedBox(height: AppSpacing.sm),
                      Text('快来发起第一个心愿吧！', style: ts.bodyMedium?.copyWith(color: cs.onSurface.withOpacity(0.4))),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadWishes,
                  child: ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: _wishes.length,
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    itemBuilder: (_, i) {
                      final w = _wishes[i];
                      final progress = (w['wish_count'] ?? 0) / (w['threshold'] ?? 3);
                      return Card(
                        margin: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: Padding(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Expanded(child: Text(w['title'] ?? '', style: ts.titleMedium)),
                                const SizedBox(width: AppSpacing.md),
                                FilledButton.icon(
                                  onPressed: () => _joinWish(w['id']),
                                  icon: const Icon(Icons.thumb_up, size: 18),
                                  label: const Text('我也想去'),
                                  style: FilledButton.styleFrom(minimumSize: Size.zero, height: 36),
                                ),
                              ]),
                              const SizedBox(height: AppSpacing.sm),
                              Row(children: [
                                Icon(Icons.people_outline, size: 14, color: cs.onSurfaceVariant),
                                const SizedBox(width: 4),
                                Text('${w['wish_count'] ?? 0}/${w['threshold'] ?? 3} 人响应',
                                    style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                                const SizedBox(width: AppSpacing.lg),
                                Icon(Icons.access_time, size: 14, color: cs.onSurfaceVariant),
                                const SizedBox(width: 4),
                                Text(_timeLabel(w['created_at'] ?? ''), style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                              ]),
                              const SizedBox(height: AppSpacing.sm),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(AppRadius.sm),
                                child: LinearProgressIndicator(
                                  value: progress.clamp(0.0, 1.0),
                                  minHeight: 4,
                                  backgroundColor: cs.surfaceContainerHighest,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/create-circle'),
        label: const Text('发起心愿'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}
