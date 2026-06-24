import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'config/routes.dart';

class YiQiPinApp extends StatelessWidget {
  const YiQiPinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '一起拼',
      theme: AppTheme.light,
      initialRoute: '/splash',
      onGenerateRoute: AppRoutes.generateRoute,
      debugShowCheckedModeBanner: false,
    );
  }
}
