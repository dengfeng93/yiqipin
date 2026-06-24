import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/location_provider.dart';
import '../services/api_service.dart';

class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});
  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  final _pageCtrl = PageController();
  final _api = ApiService();
  int _currentPage = 0;
  final Set<String> _selectedTags = {};

  final _pages = const [
    OnboardingContent(Icons.explore, '发现附近活动', '随时查看你身边的组局'),
    OnboardingContent(Icons.groups, '加入或发起', '一键加入或3步创建'),
    OnboardingContent(Icons.chat, '实时聊天', '圈子内文字+图片实时聊天'),
  ];

  static const _interestOptions = [
    '运动',
    '美食',
    '桌游',
    'K歌',
    '学习',
    '旅行',
    '电影',
    '摄影',
    '宠物',
    '其他'
  ];

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    await ref.read(locationProvider.notifier).getCurrentLocation();
    if (_selectedTags.isNotEmpty) {
      await _api.patch('/users/me',
          {'interests': _selectedTags.toList()});
    }
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _currentPage == _pages.length;
    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          Expanded(
              child: PageView.builder(
            controller: _pageCtrl,
            itemCount: _pages.length + 1,
            onPageChanged: (i) =>
                setState(() => _currentPage = i),
            itemBuilder: (_, i) {
              if (i < _pages.length) {
                final p = _pages[i];
                return Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                        mainAxisAlignment:
                            MainAxisAlignment.center,
                        children: [
                          Icon(p.icon,
                              size: 120,
                              color: Theme.of(context)
                                  .primaryColor),
                          const SizedBox(height: 24),
                          Text(p.title,
                              style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight:
                                      FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(p.subtitle,
                              style: const TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey)),
                        ]));
              }
              return Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                      mainAxisAlignment:
                          MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.interests,
                            size: 120, color: Colors.orange),
                        const SizedBox(height: 24),
                        const Text('选择你的兴趣',
                            style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        const Text('为你推荐合适的圈子',
                            style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey)),
                        const SizedBox(height: 24),
                        Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _interestOptions
                                .map((tag) => FilterChip(
                                      label: Text(tag),
                                      selected: _selectedTags
                                          .contains(tag),
                                      onSelected: (v) =>
                                          setState(() => v
                                              ? _selectedTags
                                                  .add(tag)
                                              : _selectedTags
                                                  .remove(tag)),
                                    ))
                                .toList()),
                      ]));
            },
          )),
          Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                  _pages.length + 1,
                  (i) => Container(
                      margin: const EdgeInsets.all(4),
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _currentPage == i
                              ? Colors.orange
                              : Colors.grey[300])))),
          const SizedBox(height: 24),
          Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: isLast
                        ? _completeOnboarding
                        : () => _pageCtrl.nextPage(
                            duration: const Duration(
                                milliseconds: 300),
                            curve: Curves.easeInOut),
                    child: Text(isLast ? '开始使用' : '下一步'),
                  ))),
          const SizedBox(height: 32),
        ]),
      ),
    );
  }
}

class OnboardingContent {
  final IconData icon;
  final String title;
  final String subtitle;
  const OnboardingContent(this.icon, this.title, this.subtitle);
}
