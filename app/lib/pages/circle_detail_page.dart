import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/error_state.dart';

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
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final circleRes = await _api.get('/circles/${widget.circleId}');
      final membersRes = await _api.get('/circles/${widget.circleId}/members');
      if (mounted) {
        setState(() {
          _circle = circleRes.data['data'];
          _members = List<Map<String, dynamic>>.from(membersRes.data['data'] ?? []);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _joinCircle() async {
    try {
      await _api.post('/circles/${widget.circleId}/join');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('加入成功'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md))),
        );
      }
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('加入失败: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    if (_loading) return Scaffold(appBar: AppBar(), body: const SkeletonList(count: 3));
    if (_error != null) return Scaffold(appBar: AppBar(), body: ErrorStateWidget(message: _error!, onRetry: _load));
    if (_circle == null) return Scaffold(appBar: AppBar(), body: const ErrorStateWidget(message: '圈子不存在'));

    final c = _circle!;
    final canJoin = c['status'] == 'active' || c['status'] == 'preparing';

    return Scaffold(
      appBar: AppBar(
        title: Text(c['title'] ?? ''),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () => Share.share(
              '🏀 ${c['title']}\n📍 ${c['address'] ?? "附近"}\n👥 ${c['member_count'] ?? 0}/${c['max_members']}人\n\n一起来玩！下载"一起拼"App → https://yiqipin.cn',
              subject: c['title'],
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(c['title'] ?? '', style: ts.headlineSmall),
                const SizedBox(height: AppSpacing.md),
                _infoRow('分类', c['category_name'] ?? '', cs, ts),
                _statusBadge(c['status'] ?? '', cs),
                const SizedBox(height: AppSpacing.sm),
                _infoRow('人数', '${c['member_count'] ?? 0}/${c['max_members']}人', cs, ts),
                if (c['prep_time'] > 0) _infoRow('准备时间', '${c['prep_time']}分钟', cs, ts),
                if (c['address'] != null) _infoRow('地点', c['address'], cs, ts),
                if (c['description'] != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Text(c['description'], style: ts.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
                ],
              ]),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('成员', style: ts.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          ...(_members.map((m) => ListTile(
                leading: CircleAvatar(
                  backgroundColor: cs.primaryContainer,
                  backgroundImage: m['avatar'] != null ? NetworkImage(m['avatar']) : null,
                  child: m['avatar'] == null ? Icon(Icons.person, color: cs.primary) : null,
                ),
                title: Text(m['nickname'] ?? '', style: ts.bodyLarge?.copyWith(fontWeight: FontWeight.w500)),
                subtitle: Text(m['role'] == 'creator' ? '创建者' : '成员', style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
              ))),
          const SizedBox(height: 80),
        ],
      ),
      floatingActionButton: canJoin
          ? Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                FloatingActionButton.small(
                  heroTag: 'chat',
                  onPressed: () => Navigator.pushNamed(context, '/chat', arguments: widget.circleId),
                  child: const Icon(Icons.chat_outlined),
                ),
                const SizedBox(width: AppSpacing.sm),
                FloatingActionButton(
                  heroTag: 'join',
                  onPressed: _joinCircle,
                  child: const Icon(Icons.group_add),
                ),
              ]),
            )
          : null,
    );
  }

  Widget _infoRow(String label, String value, ColorScheme cs, TextTheme ts) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Text('$label: ', style: ts.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
        Text(value, style: ts.bodyMedium),
      ]),
    );
  }

  Widget _statusBadge(String status, ColorScheme cs) {
    final (label, color) = switch (status) {
      'active' => ('进行中', AppColors.success),
      'preparing' => ('准备中', AppColors.warning),
      'archived' => ('已结束', AppColors.textHint),
      'dissolved' => ('已解散', AppColors.error),
      _ => (status, AppColors.textSecondary),
    };
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Text('状态: ', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(AppRadius.sm)),
          child: Text(label, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w500)),
        ),
      ]),
    );
  }
}
