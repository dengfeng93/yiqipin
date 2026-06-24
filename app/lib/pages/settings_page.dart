import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _api = ApiService();
  late final _auth = AuthService(_api);
  bool _incognito = false;
  bool _msgNotify = true;
  bool _sysNotify = true;
  String _phone = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final res = await _api.get('/users/me');
      final user = res.data;
      if (mounted) {
        setState(() {
          _incognito = user['is_incognito'] ?? false;
          _phone = user['phone'] ?? '';
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleIncognito(bool v) async {
    try {
      await _api.post('/users/me/incognito');
      setState(() => _incognito = v);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('设置')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(children: [
              _sectionTitle('隐私', ts),
              SwitchListTile(
                title: Text('隐身模式', style: ts.bodyLarge),
                subtitle: Text('开启后附近圈子不显示你的位置', style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                value: _incognito,
                onChanged: _toggleIncognito,
              ),
              _sectionTitle('通知', ts),
              SwitchListTile(
                title: Text('消息通知', style: ts.bodyLarge),
                subtitle: Text('圈子新消息推送', style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                value: _msgNotify,
                onChanged: (v) => setState(() => _msgNotify = v),
              ),
              SwitchListTile(
                title: Text('系统通知', style: ts.bodyLarge),
                subtitle: Text('圈子状态变更提醒', style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                value: _sysNotify,
                onChanged: (v) => setState(() => _sysNotify = v),
              ),
              _sectionTitle('账号', ts),
              ListTile(
                title: Text('手机号', style: ts.bodyLarge),
                trailing: Text(_phone.isNotEmpty ? _phone : '未绑定', style: ts.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
              ),
              ListTile(
                title: Text('微信绑定', style: ts.bodyLarge),
                trailing: const Text('已绑定', style: TextStyle(color: AppColors.success)),
              ),
              _sectionTitle('关于', ts),
              const ListTile(title: Text('版本'), trailing: Text('v1.0.0')),
              ListTile(
                title: const Text('注销账号'),
                subtitle: Text('注销后30天内可恢复', style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                trailing: Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
                onTap: () => _showDeleteDialog(),
              ),
            ]),
    );
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认注销'),
        content: const Text('注销后30天内可恢复，期间其他用户无法查看你的信息。'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('取消')),
          TextButton(
            onPressed: () async {
              await _api.delete('/auth/me');
              await _auth.logout();
              if (ctx.mounted) {
                Navigator.pop(ctx);
                Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
              }
            },
            child: const Text('确认注销', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xxl, AppSpacing.lg, AppSpacing.xs),
      child: Text(title, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: cs.onSurfaceVariant)),
    );
  }
}
