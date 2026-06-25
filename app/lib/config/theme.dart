import 'package:flutter/material.dart';

// ─── Design Tokens ──────────────────────────────────────────────

/// Spacing scale (8dp rhythm)
class AppSpacing {
  AppSpacing._();
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const xxxl = 32.0;
  static const huge = 40.0;
  static const massive = 48.0;
}

/// Border radius tokens
class AppRadius {
  AppRadius._();
  static const none = 0.0;
  static const sm = 6.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const full = 999.0;
}

/// Animation duration tokens (milliseconds)
class AppDuration {
  AppDuration._();
  static const quick = 150;
  static const normal = 250;
  static const slow = 350;
}

/// Elevation / shadow tokens
class AppElevation {
  AppElevation._();
  static const none = 0.0;
  static const card = 1.0;
  static const fab = 6.0;
  static const appBar = 0.0;
  static const modal = 8.0;
}

/// Icon size tokens
class AppIconSize {
  AppIconSize._();
  static const sm = 18.0;
  static const md = 24.0;
  static const lg = 32.0;
  static const xl = 48.0;
}

// ─── Color Palette ──────────────────────────────────────────────

class AppColors {
  AppColors._();

  // Brand
  static const primary = Color(0xFFFF8C00);
  static const primaryDark = Color(0xFFE07800);
  static const primaryLight = Color(0xFFFFE0B2);

  // Semantic
  static const error = Color(0xFFEF4444);
  static const errorLight = Color(0xFFFEE2E2);
  static const success = Color(0xFF22C55E);
  static const successLight = Color(0xFFDCFCE7);
  static const info = Color(0xFF3B82F6);
  static const infoLight = Color(0xFFDBEAFE);
  static const warning = Color(0xFFF59E0B);
  static const warningLight = Color(0xFFFEF3C7);

  // Neutrals
  static const textPrimary = Color(0xFF1E293B);
  static const textSecondary = Color(0xFF64748B);
  static const textHint = Color(0xFF94A3B8);
  static const border = Color(0xFFE2E8F0);
  static const divider = Color(0xFFF1F5F9);
  static const background = Color(0xFFFFFBF5);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceVariant = Color(0xFFF8FAFC);
}

// ─── Material 3 Color Schemes ───────────────────────────────────

const _lightColorScheme = ColorScheme(
  brightness: Brightness.light,
  primary: AppColors.primary,
  onPrimary: Color(0xFFFFFFFF),
  primaryContainer: AppColors.primaryLight,
  onPrimaryContainer: Color(0xFF3E1500),
  secondary: AppColors.info,
  onSecondary: Color(0xFFFFFFFF),
  secondaryContainer: AppColors.infoLight,
  onSecondaryContainer: Color(0xFF1E3A5F),
  tertiary: AppColors.success,
  onTertiary: Color(0xFFFFFFFF),
  tertiaryContainer: AppColors.successLight,
  onTertiaryContainer: Color(0xFF052E0B),
  error: AppColors.error,
  onError: Color(0xFFFFFFFF),
  errorContainer: AppColors.errorLight,
  onErrorContainer: Color(0xFF4C0404),
  surface: AppColors.surface,
  onSurface: AppColors.textPrimary,
  surfaceContainerHighest: Color(0xFFF1F5F9),
  onSurfaceVariant: AppColors.textSecondary,
  outline: AppColors.border,
  outlineVariant: AppColors.divider,
  shadow: Color(0x1A000000),
  scrim: Color(0x66000000),
);

const _darkColorScheme = ColorScheme(
  brightness: Brightness.dark,
  primary: Color(0xFFFFBD66),
  onPrimary: Color(0xFF4A2800),
  primaryContainer: Color(0xFFE07800),
  onPrimaryContainer: Color(0xFFFFE0B2),
  secondary: Color(0xFF93C5FD),
  onSecondary: Color(0xFF1E3A5F),
  secondaryContainer: Color(0xFF1E3A5F),
  onSecondaryContainer: Color(0xFFDBEAFE),
  tertiary: Color(0xFF86EFAC),
  onTertiary: Color(0xFF052E0B),
  tertiaryContainer: Color(0xFF166534),
  onTertiaryContainer: Color(0xFFDCFCE7),
  error: Color(0xFFFCA5A5),
  onError: Color(0xFF4C0404),
  errorContainer: Color(0xFF7F1D1D),
  onErrorContainer: Color(0xFFFEE2E2),
  surface: Color(0xFF1A1A2E),
  onSurface: Color(0xFFF1F5F9),
  surfaceContainerHighest: Color(0xFF252540),
  onSurfaceVariant: Color(0xFF94A3B8),
  outline: Color(0xFF475569),
  outlineVariant: Color(0xFF334155),
  shadow: Color(0x33000000),
  scrim: Color(0x99000000),
);

// ─── Text Theme ─────────────────────────────────────────────────

const _textTheme = TextTheme(
  displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: -0.5, height: 1.25),
  displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.25, height: 1.3),
  displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, height: 1.35),
  headlineLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, height: 1.3),
  headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, height: 1.35),
  headlineSmall: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.4),
  titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, height: 1.4),
  titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, height: 1.5),
  titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, height: 1.5),
  bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 1.5),
  bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.5),
  bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, height: 1.5),
  labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, height: 1.4, letterSpacing: 0.5),
  labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 1.4, letterSpacing: 0.5),
  labelSmall: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, height: 1.4, letterSpacing: 0.5),
);

// ─── Theme Builders ─────────────────────────────────────────────

ThemeData _buildTheme(ColorScheme colorScheme) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    fontFamily: 'PingFang SC',
    textTheme: _textTheme,
    scaffoldBackgroundColor: colorScheme.surface,

    // AppBar
    appBarTheme: AppBarTheme(
      backgroundColor: colorScheme.surface,
      foregroundColor: colorScheme.onSurface,
      centerTitle: true,
      elevation: AppElevation.appBar,
      scrolledUnderElevation: 1,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: _textTheme.titleMedium?.copyWith(color: colorScheme.onSurface),
    ),

    // Card
    cardTheme: CardThemeData(
      color: colorScheme.surface,
      elevation: AppElevation.card,
      shadowColor: colorScheme.shadow,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
    ),

    // Filled button (primary CTA)
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
        textStyle: _textTheme.labelLarge?.copyWith(fontSize: 16),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        disabledBackgroundColor: colorScheme.outline,
        disabledForegroundColor: colorScheme.onSurfaceVariant,
      ),
    ),

    // Outlined button
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
        textStyle: _textTheme.labelLarge?.copyWith(fontSize: 16),
        side: BorderSide(color: colorScheme.outline),
      ),
    ),

    // Text button
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        textStyle: _textTheme.labelLarge,
        foregroundColor: colorScheme.primary,
      ),
    ),

    // Input decoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: colorScheme.surfaceContainerHighest,
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: colorScheme.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: colorScheme.outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: colorScheme.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: colorScheme.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: colorScheme.error, width: 2),
      ),
      labelStyle: _textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
      hintStyle: _textTheme.bodyMedium?.copyWith(color: colorScheme.outline),
      errorStyle: _textTheme.bodySmall?.copyWith(color: colorScheme.error),
    ),

    // Chip
    chipTheme: ChipThemeData(
      backgroundColor: colorScheme.surfaceContainerHighest,
      selectedColor: colorScheme.primaryContainer,
      labelStyle: _textTheme.bodyMedium,
      secondaryLabelStyle: _textTheme.bodyMedium?.copyWith(color: colorScheme.onPrimaryContainer),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
    ),

    // Bottom navigation
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      type: BottomNavigationBarType.fixed,
      backgroundColor: colorScheme.surface,
      selectedItemColor: colorScheme.primary,
      unselectedItemColor: colorScheme.onSurfaceVariant,
      selectedLabelStyle: _textTheme.labelSmall,
      unselectedLabelStyle: _textTheme.labelSmall,
      elevation: AppElevation.card,
      landscapeLayout: BottomNavigationBarLandscapeLayout.centered,
    ),

    // Floating action button
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: colorScheme.primary,
      foregroundColor: colorScheme.onPrimary,
      elevation: AppElevation.fab,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
    ),

    // Dialog
    dialogTheme: DialogThemeData(
      backgroundColor: colorScheme.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
      titleTextStyle: _textTheme.headlineSmall?.copyWith(color: colorScheme.onSurface),
    ),

    // Snackbar
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
    ),

    // Divider
    dividerTheme: DividerThemeData(color: colorScheme.outlineVariant, thickness: 1, space: 1),

    // Tab bar
    tabBarTheme: TabBarThemeData(
      labelColor: colorScheme.primary,
      unselectedLabelColor: colorScheme.onSurfaceVariant,
      indicatorColor: colorScheme.primary,
      labelStyle: _textTheme.labelLarge,
      unselectedLabelStyle: _textTheme.labelMedium,
    ),

    // Switch
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return colorScheme.primary;
        return colorScheme.outline;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return colorScheme.primaryContainer;
        return colorScheme.surfaceContainerHighest;
      }),
    ),

    // Page transitions
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: ZoomPageTransitionsBuilder(),
      TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
    }),

    // Extensions
    extensions: const <ThemeExtension<dynamic>>[],
  );
}

// ─── Public Theme Access ────────────────────────────────────────

class AppTheme {
  AppTheme._();

  /// Light theme for the app
  static final ThemeData light = _buildTheme(_lightColorScheme);

  /// Dark theme (ready for future use)
  static final ThemeData dark = _buildTheme(_darkColorScheme);

  // Convenience getters for commonly used colors (backward compatible)
  static const primaryColor = AppColors.primary;
  static const secondaryColor = Color(0xFF2D2D2D);
  static const dangerColor = AppColors.error;
  static const successColor = AppColors.success;
}
