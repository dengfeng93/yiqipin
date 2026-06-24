import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _tokenCtrl = TextEditingController();
  final _storage = const FlutterSecureStorage();
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _tryAutoLogin());
  }

  @override
  void dispose() {
    _tokenCtrl.dispose();
    super.dispose();
  }

  Future<void> _tryAutoLogin() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null && mounted) {
      await ref.read(authProvider.notifier).checkAuth();
      if (mounted) {
        final isLoggedIn = ref.read(authProvider).isLoggedIn;
        if (isLoggedIn) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      }
    }
  }

  Future<void> _login() async {
    final token = _tokenCtrl.text.trim();
    if (token.isEmpty) {
      setState(() => _error = '请输入 Token');
      return;
    }
    setState(() { _submitting = true; _error = null; });
    try {
      await _storage.write(key: 'access_token', value: token);
      await ref.read(authProvider.notifier).checkAuth();
      if (mounted) {
        final isLoggedIn = ref.read(authProvider).isLoggedIn;
        if (isLoggedIn) {
          Navigator.pushReplacementNamed(context, '/home');
        } else {
          await _storage.deleteAll();
          setState(() => _error = 'Token 无效，请重新输入');
        }
      }
    } catch (_) {
      if (mounted) setState(() => _error = '登录失败，请检查网络');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: cs.primaryContainer,
                    borderRadius: BorderRadius.circular(AppRadius.xl),
                  ),
                  child: Icon(Icons.local_fire_department, size: 48, color: cs.primary),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text('一起拼', style: ts.displayMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: AppSpacing.xs),
                Text('随时拼 一起玩', style: ts.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
                const SizedBox(height: AppSpacing.xxxl),
                if (_submitting)
                  Column(children: [
                    SizedBox(
                      width: 48, height: 48,
                      child: CircularProgressIndicator(strokeWidth: 3, color: cs.primary),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Text('正在登录...', style: ts.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
                  ])
                else ...[
                  TextField(
                    controller: _tokenCtrl,
                    decoration: InputDecoration(
                      hintText: '输入 Mock Token（从 dev/token 端点获取）',
                      errorText: _error,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    textInputAction: TextInputAction.go,
                    onSubmitted: (_) => _login(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton(
                      onPressed: _login,
                      child: const Text('登录'),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    '先用 curl 调用 POST /api/v1/auth/dev/token\n获取 accessToken 后粘贴到上方',
                    style: ts.bodySmall?.copyWith(color: cs.onSurface.withOpacity(0.4)),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
