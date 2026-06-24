import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/empty_state.dart';

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
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCircles();
  }

  Future<void> _loadCircles() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/users/me/circles');
      final circles = (res.data['data'] as List?)
              ?.map((j) => Map<String, dynamic>.from(j))
              .toList() ??
          [];
      if (mounted) {
        setState(() {
          _activeCircles = circles.where((c) {
            final s = c['status'] as String?;
            return s == 'active' || s == 'preparing' || s == 'private_permanent';
          }).toList();
          _endedCircles = circles.where((c) {
            final s = c['status'] as String?;
            return s == 'archived' || s == 'dissolved';
          }).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
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

  String _timeLabel(String dateStr) {
    if (dateStr.isEmpty) return '';
    final diff = DateTime.now().difference(DateTime.parse(dateStr));
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    return '${diff.inDays}天前';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('消息')),
      body: _loading
          ? const SkeletonList(count: 4)
          : _activeCircles.isEmpty && _endedCircles.isEmpty
              ? const EmptyStateWidget(icon: Icons.chat_bubble_outline, title: '暂无消息', subtitle: '加入圈子后，这里会显示消息')
              : ListView(children: [
                  ..._activeCircles.map((c) => _buildActiveItem(c, cs, ts)),
                  if (_endedCircles.isNotEmpty) _buildEndedToggle(cs),
                  if (_showEnded) ..._endedCircles.map((c) => _buildEndedItem(c, cs)),
                ]),
    );
  }

  Widget _buildActiveItem(Map<String, dynamic> c, ColorScheme cs, TextTheme ts) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.xs),
      leading: Badge(
        isLabelVisible: _unreadCount(c) > 0,
        child: CircleAvatar(
          backgroundColor: cs.primaryContainer,
          child: Icon(Icons.circle, color: cs.primary, size: 24),
        ),
      ),
      title: Text(c['title'] ?? '', style: ts.bodyLarge?.copyWith(fontWeight: FontWeight.w500)),
      subtitle: Text(
        c['last_message'] ?? '',
        style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Text(_timeLabel(c['last_message_at'] ?? ''), style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
      onTap: () => Navigator.pushNamed(context, '/chat', arguments: c['id']),
    );
  }

  Widget _buildEndedToggle(ColorScheme cs) {
    return ListTile(
      leading: Icon(_showEnded ? Icons.expand_less : Icons.expand_more, color: cs.onSurfaceVariant),
      title: Text('已结束的圈子 (${_endedCircles.length})',
          style: TextStyle(color: cs.onSurfaceVariant, fontSize: 14)),
      onTap: () => setState(() => _showEnded = !_showEnded),
    );
  }

  Widget _buildEndedItem(Map<String, dynamic> c, ColorScheme cs) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      leading: CircleAvatar(
        backgroundColor: cs.surfaceContainerHighest,
        child: Icon(Icons.archive, color: cs.onSurfaceVariant),
      ),
      title: Text(c['title'] ?? '', style: TextStyle(color: cs.onSurfaceVariant)),
      subtitle: Text('已结束', style: TextStyle(color: cs.onSurfaceVariant)),
    );
  }
}
