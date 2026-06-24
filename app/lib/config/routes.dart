import 'package:flutter/material.dart';
import '../pages/splash_page.dart';
import '../pages/onboarding_page.dart';
import '../pages/home_page.dart';
import '../pages/circle_detail_page.dart';
import '../pages/create_circle_page.dart';
import '../pages/login_page.dart';
import '../pages/privacy_page.dart';
import '../pages/chat_page.dart';
import '../pages/messages_page.dart';
import '../pages/profile_page.dart';
import '../pages/settings_page.dart';
import '../pages/wishpool_page.dart';
import '../pages/search_page.dart';
import '../widgets/empty_state.dart';

class AppRoutes {
  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/splash':
        return _page(const SplashPage());
      case '/onboarding':
        return _page(const OnboardingPage());
      case '/login':
        return _page(const LoginPage());
      case '/home':
        return _page(const HomePage());
      case '/circle-detail':
        if (settings.arguments is! String) return _page(const ErrorStateWidget(message: '无效导航'));
        return _page(CircleDetailPage(circleId: settings.arguments as String));
      case '/create-circle':
        return _page(const CreateCirclePage());
      case '/chat':
        if (settings.arguments is! String) return _page(const ErrorStateWidget(message: '无效导航'));
        return _page(ChatPage(circleId: settings.arguments as String));
      case '/messages':
        return _page(const MessagesPage());
      case '/profile':
        return _page(const ProfilePage());
      case '/settings':
        return _page(const SettingsPage());
      case '/privacy':
        return _page(const PrivacyPage());
      case '/wishpool':
        return _page(const WishpoolPage());
      case '/search':
        return _page(const SearchPage());
      default:
        return _page(const HomePage());
    }
  }

  static MaterialPageRoute _page(Widget page) =>
      MaterialPageRoute(builder: (_) => page);
}
