import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _api = ApiService();
  bool _incognito = false;
  bool _msgNotify = true;
  bool _sysNotify = true;
  String _phone = '';

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final res = await _api.get('/users/me');
      final user = res.data['data'];
      if (mounted)
        setState(() {
          _incognito = user['is_incognito'] ?? false;
          _phone = user['phone'] ?? '';
          _msgNotify = user['msg_notify'] ?? true;
          _sysNotify = user['sys_notify'] ?? true;
        });
    } catch (_) {}
  }

  Future<void> _toggleIncognito(bool v) async {
    try {
      await _api.patch('/users/me', {'is_incognito': v});
      setState(() => _incognito = v);
    } catch (_) {}
  }

  Future<void> _toggleNotify(String field, bool v) async {
    try {
      await _api.patch('/users/me', {field: v});
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('设置')),
      body: ListView(children: [
        const _SectionTitle('隐私'),
        SwitchListTile(
            title: const Text('隐身模式'),
            subtitle: const Text('开启后附近圈子不显示你的位置'),
            value: _incognito,
            onChanged: _toggleIncognito),
        const _SectionTitle('通知'),
        SwitchListTile(
            title: const Text('消息通知'),
            subtitle: const Text('圈子新消息推送'),
            value: _msgNotify,
            onChanged: (v) {
              setState(() => _msgNotify = v);
              _toggleNotify('msg_notify', v);
            }),
        SwitchListTile(
            title: const Text('系统通知'),
            subtitle: const Text('圈子状态变更提醒'),
            value: _sysNotify,
            onChanged: (v) {
              setState(() => _sysNotify = v);
              _toggleNotify('sys_notify', v);
            }),
        const _SectionTitle('账号'),
        ListTile(
            title: const Text('手机号'),
            trailing:
                Text(_phone.isNotEmpty ? _phone : '未绑定')),
        ListTile(
            title: const Text('微信绑定'),
            trailing: const Text('已绑定',
                style: TextStyle(color: Colors.green))),
        const _SectionTitle('关于'),
        const ListTile(
            title: Text('版本'), trailing: Text('v1.0.0')),
        ListTile(
            title: const Text('注销账号'),
            subtitle: const Text('注销后30天内可恢复'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                        title: const Text('确认注销'),
                        content: const Text(
                            '注销后30天内可恢复，期间其他用户无法查看你的信息。'),
                        actions: [
                          TextButton(
                              onPressed: () =>
                                  Navigator.pop(ctx),
                              child: const Text('取消')),
                          TextButton(
                              onPressed: () =>
                                  Navigator.pop(ctx),
                              child: const Text('确认注销',
                                  style: TextStyle(
                                      color: Colors.red))),
                        ],
                      ));
            }),
      ]),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(title,
          style: const TextStyle(
              fontSize: 13,
              color: Colors.grey,
              fontWeight: FontWeight.w600)),
    );
  }
}
