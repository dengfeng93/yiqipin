import 'package:flutter/material.dart';

class AppTheme {
  static const primaryColor = Color(0xFFFF8C00);
  static const secondaryColor = Color(0xFF2D2D2D);
  static const dangerColor = Color(0xFFFF4444);
  static const successColor = Color(0xFF4CAF50);

  static final light = ThemeData(
    useMaterial3: true,
    colorSchemeSeed: primaryColor,
    brightness: Brightness.light,
    fontFamily: 'PingFang SC',
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    appBarTheme: const AppBarTheme(
      centerTitle: true,
      elevation: 0,
    ),
  );
}
