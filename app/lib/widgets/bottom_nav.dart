import 'package:flutter/material.dart';
import '../config/theme.dart';

class BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNav({super.key, required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.explore), label: '发现'),
        BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: '消息'),
        BottomNavigationBarItem(icon: SizedBox.shrink(), label: ''),
        BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: '我的'),
      ],
    );
  }
}
