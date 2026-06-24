import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/location_provider.dart';
import '../services/api_service.dart';
import '../models/circle.dart';
import '../widgets/circle_card.dart';
import '../widgets/bottom_nav.dart';

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
    final loc = ref.read(locationProvider);
    if (loc.lat == null) return;
    final res = await _api.get('/circles',
        params: {'lat': loc.lat, 'lng': loc.lng, 'range': 10});
    final data = (res.data['data'] as List?) ?? [];
    final meta = res.data['meta'] as Map<String, dynamic>? ?? {};
    setState(() {
      _circles = data.map((j) => Circle.fromJson(j)).toList();
      _nearbyUserCount = meta['nearby_user_count'] ?? 0;
      _todayCircleCount = meta['today_circle_count'] ?? 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('一起拼'),
        actions: [
          IconButton(
              icon: Icon(
                  _isListView ? Icons.view_carousel : Icons.view_list),
              onPressed: () =>
                  setState(() => _isListView = !_isListView)),
          IconButton(
              icon: const Icon(Icons.search),
              onPressed: () =>
                  Navigator.pushNamed(context, '/search')),
        ],
      ),
      body: Column(children: [
        if (_nearbyUserCount > 0 || _todayCircleCount > 0)
          _buildSocialProof(),
        Expanded(
            child: _circles.isEmpty
                ? _buildEmptyState()
                : _isListView
                    ? ListView.builder(
                        itemCount: _circles.length,
                        itemBuilder: (_, i) =>
                            ListTile(title: Text(_circles[i].title)))
                    : PageView.builder(
                        controller: _pageController,
                        scrollDirection: Axis.vertical,
                        itemCount: _circles.length,
                        itemBuilder: (_, i) => CircleCard(
                          circle: _circles[i],
                          onJoin: () =>
                              _joinCircle(_circles[i].id),
                          onDetail: () => Navigator.pushNamed(
                              context, '/circle-detail',
                              arguments: _circles[i].id),
                          onSkip: () {
                            if (_pageController.hasClients) {
                              _pageController.nextPage(
                                duration: const Duration(
                                    milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            }
                          },
                        ),
                      )),
      ]),
      floatingActionButton: FloatingActionButton(
        onPressed: () =>
            Navigator.pushNamed(context, '/create-circle'),
        child: const Icon(Icons.add),
      ),
      bottomNavigationBar: BottomNav(
          currentIndex: _tabIndex, onTap: (i) {
        setState(() => _tabIndex = i);
        if (i == 1) Navigator.pushNamed(context, '/messages');
        if (i == 3) Navigator.pushNamed(context, '/profile');
      }),
    );
  }

  Future<void> _joinCircle(String id) async {
    try {
      await _api.post('/circles/$id/join');
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('加入成功')));
      _loadCircles();
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('加入失败: $e')));
    }
  }

  Widget _buildSocialProof() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.person, size: 14, color: Colors.orange),
          const SizedBox(width: 4),
          Text('附近 $_nearbyUserCount 人在组局',
              style:
                  const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(width: 16),
          const Icon(Icons.check_circle,
              size: 14, color: Colors.green),
          const SizedBox(width: 4),
          Text('今天 $_todayCircleCount 个圈子成局',
              style:
                  const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return FutureBuilder<Map<String, dynamic>>(
      future: _fetchEmptyStateData(),
      builder: (_, snapshot) {
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());

        final wishes = snapshot.data!['wishes'] as List? ?? [];
        final hots = snapshot.data!['hots'] as List? ?? [];

        if (wishes.isNotEmpty) {
          return ListView(padding: const EdgeInsets.all(16), children: [
            const Text('附近暂无进行中的圈子',
                style: TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            const Text('为你发现以下心愿单',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...wishes.map((w) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.favorite_border,
                        color: Colors.orange),
                    title: Text(w['title'] ?? ''),
                    subtitle: Text(
                        '已有 ${w['wish_count'] ?? 0}/${w['threshold'] ?? 3} 人响应 · ${w['distance_text'] ?? ''}'),
                    trailing: FilledButton(
                        onPressed: () async {
                          await _api
                              .post('/wishes/${w['id']}/join');
                          ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('+1 成功')));
                        },
                        child: const Text('+1')),
                  ),
                )),
          ]);
        }

        return ListView(padding: const EdgeInsets.all(16), children: [
          const Icon(Icons.inbox, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('附近暂无圈子和心愿单',
              style: TextStyle(fontSize: 16, color: Colors.grey),
              textAlign: TextAlign.center),
          const SizedBox(height: 8),
          const Text('试试这些热门活动',
              style:
                  TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          ...hots.map((h) => Card(
                child: ListTile(
                  leading: const Icon(Icons.local_fire_department,
                      color: Colors.deepOrange),
                  title: Text(h['title'] ?? ''),
                  subtitle: Text(h['description'] ?? ''),
                  trailing: FilledButton(
                      onPressed: () => Navigator.pushNamed(
                          context, '/create-circle'),
                      child: const Text('发起')),
                ),
              )),
          const SizedBox(height: 24),
          SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () =>
                    Navigator.pushNamed(context, '/create-circle'),
                child: const Text('创建第一个圈子'),
              )),
        ]);
      },
    );
  }

  Future<Map<String, dynamic>> _fetchEmptyStateData() async {
    final result = <String, dynamic>{'wishes': [], 'hots': []};
    try {
      final wishRes = await _api
          .get('/wishes', params: {'status': 'waiting', 'limit': '5'});
      result['wishes'] = wishRes.data['data'] ?? [];
    } catch (_) {}
    try {
      final hotRes =
          await _api.get('/categories', params: {'hot': 'true'});
      result['hots'] = hotRes.data['data'] ?? [];
    } catch (_) {}
    return result;
  }
}
