import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../providers/location_provider.dart';
import '../services/api_service.dart';
import '../models/circle.dart';
import '../widgets/circle_card.dart';
import '../widgets/bottom_nav.dart';
import '../widgets/skeleton_loader.dart';
import '../widgets/empty_state.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _api = ApiService();
  final _pageController = PageController();
  List<Circle> _circles = [];
  bool _isListView = false;
  int _tabIndex = 0;
  int _nearbyUserCount = 0;
  int _todayCircleCount = 0;
  bool _loading = true;
  Future<Map<String, dynamic>>? _emptyStateFuture;

  @override
  void initState() {
    super.initState();
    _loadCircles();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadCircles() async {
    setState(() => _loading = true);
    try {
      final loc = ref.read(locationProvider);
      if (loc.lat == null) return;
      final res = await _api.get('/circles', params: {'lat': loc.lat, 'lng': loc.lng, 'range': 10});
      final payload = res.data['data'] as Map<String, dynamic>?;
      final data = (payload?['data'] as List?) ?? [];
      final meta = (payload?['meta'] as Map<String, dynamic>?) ?? {};
      if (mounted) {
        setState(() {
          _circles = data.map((j) => Circle.fromJson(j)).toList();
          _nearbyUserCount = meta['nearby_user_count'] ?? 0;
          _todayCircleCount = meta['today_circle_count'] ?? 0;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _loading = false; _error = '加载失败'; });
    }
  }

  String? _error;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text('一起拼', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: Icon(_isListView ? Icons.view_carousel : Icons.view_list),
            onPressed: () => setState(() => _isListView = !_isListView),
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => Navigator.pushNamed(context, '/search'),
          ),
        ],
      ),
      body: _error != null
          ? Center(child: ErrorStateWidget(message: _error!, onRetry: _loadCircles))
          : _loading
          ? Column(children: [
              if (_nearbyUserCount > 0 || _todayCircleCount > 0) _buildSocialProof(cs),
              const Expanded(child: SkeletonList(count: 3)),
            ])
          : _circles.isEmpty
              ? Column(children: [
                  if (_nearbyUserCount > 0 || _todayCircleCount > 0) _buildSocialProof(cs),
                  Expanded(child: _buildEmptyState(cs)),
                ])
              : Column(children: [
                  if (_nearbyUserCount > 0 || _todayCircleCount > 0) _buildSocialProof(cs),
                  Expanded(
                    child: _isListView
                        ? ListView.builder(
                            padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                            itemCount: _circles.length,
                            itemBuilder: (_, i) => ListTile(
                              title: Text(_circles[i].title),
                              subtitle: Text('${_circles[i].memberCount}/${_circles[i].maxMembers}人 · ${_circles[i].address ?? ""}'),
                              onTap: () => Navigator.pushNamed(context, '/circle-detail', arguments: _circles[i].id),
                            ),
                          )
                        : PageView.builder(
                            controller: _pageController,
                            scrollDirection: Axis.vertical,
                            itemCount: _circles.length,
                            itemBuilder: (_, i) => CircleCard(
                              circle: _circles[i],
                              onJoin: () => _joinCircle(_circles[i].id),
                              onDetail: () => Navigator.pushNamed(context, '/circle-detail', arguments: _circles[i].id),
                              onSkip: () {
                                if (_pageController.hasClients) {
                                  _pageController.nextPage(
                                    duration: const Duration(milliseconds: 300),
                                    curve: Curves.easeInOut,
                                  );
                                }
                              },
                            ),
                          ),
                  ),
                ]),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/create-circle'),
        child: const Icon(Icons.add),
      ),
      bottomNavigationBar: BottomNav(currentIndex: _tabIndex, onTap: (i) {
        setState(() => _tabIndex = i);
        if (i == 1) Navigator.pushReplacementNamed(context, '/messages');
        if (i == 3) Navigator.pushReplacementNamed(context, '/profile');
      }),
    );
  }

  Future<void> _joinCircle(String id) async {
    try {
      await _api.post('/circles/$id/join');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('加入成功'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md))),
        );
      }
      _loadCircles();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('加入失败: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md))),
        );
      }
    }
  }

  Widget _buildSocialProof(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      decoration: BoxDecoration(color: cs.surface, border: Border(bottom: BorderSide(color: cs.outlineVariant))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person, size: 14, color: cs.primary),
          const SizedBox(width: 4),
          Text('附近 $_nearbyUserCount 人在组局', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
          const SizedBox(width: AppSpacing.lg),
          Icon(Icons.check_circle, size: 14, color: AppColors.success),
          const SizedBox(width: 4),
          Text('今天 $_todayCircleCount 个圈子成局', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme cs) {
    _emptyStateFuture ??= _fetchEmptyStateData();
    return FutureBuilder<Map<String, dynamic>>(
      future: _emptyStateFuture,
      builder: (_, snapshot) {
        if (!snapshot.hasData) return const SkeletonList(count: 3);

        final wishes = snapshot.data!['wishes'] as List? ?? [];
        final hots = snapshot.data!['hots'] as List? ?? [];

        if (wishes.isNotEmpty) {
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              const EmptyStateWidget(icon: Icons.explore, title: '附近暂无进行中的圈子', subtitle: '为你发现以下心愿单'),
              ...wishes.map((w) => Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Row(children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(color: cs.primaryContainer, borderRadius: BorderRadius.circular(AppRadius.md)),
                          child: Icon(Icons.favorite_border, color: cs.primary),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(w['title'] ?? '', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 2),
                            Text('已有 ${w['wish_count'] ?? 0}/${w['threshold'] ?? 3} 人响应 · ${w['distance_text'] ?? ''}',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                          ]),
                        ),
                        FilledButton(
                          onPressed: () async {
                            try {
                              await _api.post('/wishes/${w['id']}/join');
                              if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('+1 成功')));
                            } catch (_) {
                              if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('操作失败'), backgroundColor: AppColors.error));
                            }
                          },
                          style: FilledButton.styleFrom(minimumSize: Size.zero, height: 36),
                          child: const Text('+1'),
                        ),
                      ]),
                    ),
                  )),
            ],
          );
        }

        return ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            const EmptyStateWidget(icon: Icons.inbox, title: '附近暂无圈子和心愿单', subtitle: '试试这些热门活动'),
            ...hots.map((h) => Card(
                  child: ListTile(
                    leading: Icon(Icons.local_fire_department, color: AppColors.error),
                    title: Text(h['title'] ?? ''),
                    subtitle: Text(h['description'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
                    trailing: FilledButton(
                      onPressed: () => Navigator.pushNamed(context, '/create-circle'),
                      style: FilledButton.styleFrom(minimumSize: Size.zero, height: 36),
                      child: const Text('发起'),
                    ),
                  ),
                )),
            const SizedBox(height: AppSpacing.xxl),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pushNamed(context, '/create-circle'),
                child: const Text('创建第一个圈子'),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<Map<String, dynamic>> _fetchEmptyStateData() async {
    final result = <String, dynamic>{'wishes': [], 'hots': []};
    try {
      final wishRes = await _api.get('/wishes', params: {'status': 'waiting', 'limit': '5'});
      result['wishes'] = wishRes.data['data'] ?? [];
    } catch (_) {
      result['wishes'] = [];
    }
    try {
      final hotRes = await _api.get('/categories', params: {'hot': 'true'});
      result['hots'] = hotRes.data['data'] ?? [];
    } catch (_) {
      result['hots'] = [];
    }
    return result;
  }
}
