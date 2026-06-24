import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
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
    OnboardingContent(Icons.explore_rounded, '发现附近活动', '随时查看你身边的组局'),
    OnboardingContent(Icons.groups_rounded, '加入或发起', '一键加入或3步创建'),
    OnboardingContent(Icons.chat_rounded, '实时聊天', '圈子内文字+图片实时聊天'),
  ];

  static const _interestOptions = ['运动', '美食', '桌游', 'K歌', '学习', '旅行', '电影', '摄影', '宠物', '其他'];

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    await ref.read(locationProvider.notifier).getCurrentLocation();
    if (_selectedTags.isNotEmpty) {
      await _api.patch('/users/me', {'interests': _selectedTags.toList()});
    }
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;
    final isLast = _currentPage == _pages.length;

    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          SizedBox(
            height: 44,
            child: _currentPage < _pages.length
                ? Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _completeOnboarding,
                      child: Text('跳过', style: ts.labelLarge?.copyWith(color: cs.onSurfaceVariant)),
                    ),
                  )
                : null,
          ),
          Expanded(
            child: PageView.builder(
              controller: _pageCtrl,
              itemCount: _pages.length + 1,
              onPageChanged: (i) => setState(() => _currentPage = i),
              itemBuilder: (_, i) {
                if (i < _pages.length) {
                  final p = _pages[i];
                  return Padding(
                    padding: const EdgeInsets.all(AppSpacing.xxxl),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: cs.primaryContainer,
                            borderRadius: BorderRadius.circular(AppRadius.xl),
                          ),
                          child: Icon(p.icon, size: 64, color: cs.primary),
                        ),
                        const SizedBox(height: AppSpacing.xxl),
                        Text(p.title, style: ts.headlineMedium),
                        const SizedBox(height: AppSpacing.sm),
                        Text(p.subtitle, style: ts.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
                      ],
                    ),
                  );
                }
                return Padding(
                  padding: const EdgeInsets.all(AppSpacing.xxxl),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: cs.tertiaryContainer,
                          borderRadius: BorderRadius.circular(AppRadius.xl),
                        ),
                        child: const Icon(Icons.interests_rounded, size: 64, color: AppColors.success),
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      Text('选择你的兴趣', style: ts.headlineMedium),
                      const SizedBox(height: AppSpacing.sm),
                      Text('为你推荐合适的圈子', style: ts.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
                      const SizedBox(height: AppSpacing.xxl),
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.sm,
                        children: _interestOptions
                            .map((tag) => FilterChip(
                                  label: Text(tag),
                                  selected: _selectedTags.contains(tag),
                                  onSelected: (v) => setState(() {
                                    v ? _selectedTags.add(tag) : _selectedTags.remove(tag);
                                  }),
                                ))
                            .toList(),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _pages.length + 1,
              (i) => AnimatedContainer(
                duration: const Duration(milliseconds: AppDuration.normal),
                margin: const EdgeInsets.all(4),
                width: _currentPage == i ? 20 : 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: _currentPage == i ? BoxShape.rectangle : BoxShape.circle,
                  borderRadius: _currentPage == i ? BorderRadius.circular(4) : null,
                  color: _currentPage == i ? cs.primary : cs.outlineVariant,
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: isLast
                    ? _completeOnboarding
                    : () => _pageCtrl.nextPage(
                        duration: const Duration(milliseconds: AppDuration.normal),
                        curve: Curves.easeInOut,
                      ),
                child: Text(isLast ? '开始使用' : '下一步'),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xxxl),
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
