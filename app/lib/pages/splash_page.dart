import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});
  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await ref.read(authProvider.notifier).checkAuth();
    final isLoggedIn = ref.read(authProvider).isLoggedIn;
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    Navigator.pushReplacementNamed(
        context, isLoggedIn ? '/home' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
          child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
            Icon(Icons.groups,
                size: 80, color: Theme.of(context).primaryColor),
            const SizedBox(height: 16),
            Text('一起拼',
                style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor)),
            const SizedBox(height: 8),
            const Text('随时拼 一起玩',
                style: TextStyle(fontSize: 14, color: Colors.grey)),
          ])),
    );
  }
}
