import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/error_state.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});
  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  final _api = ApiService();
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await _api.get('/users/me');
      if (mounted) setState(() { _stats = res.data['data']; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('我的')),
      body: _loading
          ? const SkeletonList(count: 3)
          : _error != null
              ? ErrorStateWidget(message: _error!, onRetry: _loadStats)
              : ListView(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  children: [
                    const SizedBox(height: AppSpacing.sm),
                    Center(
                      child: Column(children: [
                        CircleAvatar(
                          radius: 44,
                          backgroundColor: cs.primaryContainer,
                          backgroundImage: user?['avatar'] != null ? NetworkImage(user!['avatar']) : null,
                          child: user?['avatar'] == null
                              ? Icon(Icons.person, size: 40, color: cs.primary)
                              : null,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(user?['nickname'] ?? '未命名', style: ts.titleLarge),
                      ]),
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                    _buildStatsRow(cs, ts),
                    const SizedBox(height: AppSpacing.xxl),
                    _menuItem(Icons.circle_outlined, '我的圈子', () {}),
                    _menuItem(Icons.star_outline, '评价记录', () {}),
                    _menuItem(Icons.settings_outlined, '设置', () => Navigator.pushNamed(context, '/settings')),
                    const Divider(height: AppSpacing.xxxl),
                    _menuItem(Icons.logout, '退出登录', () => ref.read(authProvider.notifier).logout(),
                        color: cs.error),
                  ],
                ),
    );
  }

  Widget _buildStatsRow(ColorScheme cs, TextTheme ts) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withOpacity(0.4),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _statCell('发起', '${_stats?['total_created'] ?? 0}', ts),
          _statCell('参与', '${_stats?['total_joined'] ?? 0}', ts),
          _statCell('到场率',
              _stats?['showup_rate'] != null ? "${(_stats!['showup_rate'] as num * 100).toStringAsFixed(0)}%" : '-', ts),
        ],
      ),
    );
  }

  Widget _statCell(String label, String value, TextTheme ts) {
    return Column(children: [
      Text(value, style: ts.headlineMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      Text(label, style: ts.bodySmall?.copyWith(color: AppColors.textSecondary)),
    ]);
  }

  Widget _menuItem(IconData icon, String title, VoidCallback onTap, {Color? color}) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon, color: color ?? cs.onSurface),
      title: Text(title, style: TextStyle(color: color ?? cs.onSurface)),
      trailing: Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
      onTap: onTap,
    );
  }
}
