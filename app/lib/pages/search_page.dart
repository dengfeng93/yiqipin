import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../providers/location_provider.dart';
import '../widgets/skeleton_loader.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});
  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final _api = ApiService();
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _results = [];
  List<Map<String, dynamic>> _categories = [];
  String? _selectedCategory;
  bool _loading = false;
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await _api.get('/categories');
      if (mounted) setState(() => _categories = List<Map<String, dynamic>>.from(res.data['data'] ?? []));
    } catch (_) {
      if (mounted) setState(() => _categories = []);
    }
  }

  Future<void> _search(String q) async {
    if (q.trim().isEmpty) return;
    setState(() { _loading = true; _hasSearched = true; });
    final loc = ref.read(locationProvider);
    final params = <String, dynamic>{'q': q};
    if (loc.lat != null && loc.lng != null) {
      params['lat'] = loc.lat;
      params['lng'] = loc.lng;
    }
    if (_selectedCategory != null) params['category_id'] = _selectedCategory;
    try {
      final res = await _api.get('/search', params: params);
      if (mounted) setState(() {
        _results = List<Map<String, dynamic>>.from(res.data['data'] ?? []);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchCtrl,
          autofocus: true,
          style: ts.bodyLarge,
          decoration: InputDecoration(
            hintText: '搜索圈子...',
            border: InputBorder.none,
            hintStyle: ts.bodyLarge?.copyWith(color: cs.onSurfaceVariant),
          ),
          onChanged: (_) => setState(() {}),
          onSubmitted: (v) {
            if (v.trim().isEmpty) return;
            _search(v);
          },
        ),
        actions: [
          if (_searchCtrl.text.isNotEmpty)
            IconButton(
              icon: Icon(Icons.clear, color: cs.onSurfaceVariant),
              onPressed: () {
                _searchCtrl.clear();
                setState(() { _results.clear(); _hasSearched = false; });
              },
            ),
        ],
      ),
      body: Column(children: [
        if (_categories.isNotEmpty)
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
              children: _categories.map((c) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: FilterChip(
                  label: Text(c['name'] ?? ''),
                  selected: _selectedCategory == c['id'],
                  onSelected: (v) => setState(() {
                    _selectedCategory = v ? c['id'] : null;
                    if (_searchCtrl.text.isNotEmpty) _search(_searchCtrl.text);
                  }),
                ),
              )).toList(),
            ),
          ),
        const Divider(height: 1),
        Expanded(
          child: _loading
              ? const SkeletonList(count: 3)
              : !_hasSearched
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.search, size: 64, color: cs.onSurface.withOpacity(0.15)),
                          const SizedBox(height: AppSpacing.lg),
                          Text('搜索你感兴趣的圈子', style: ts.titleMedium?.copyWith(color: cs.onSurfaceVariant)),
                        ],
                      ),
                    )
                  : _results.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.search_off, size: 64, color: cs.onSurface.withOpacity(0.15)),
                              const SizedBox(height: AppSpacing.lg),
                              Text('没有找到相关圈子', style: ts.titleMedium?.copyWith(color: cs.onSurfaceVariant)),
                              const SizedBox(height: AppSpacing.sm),
                              Text('换个关键词试试', style: ts.bodyMedium?.copyWith(color: cs.onSurface.withOpacity(0.4))),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: _results.length,
                          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                          itemBuilder: (_, i) {
                            final r = _results[i];
                            return ListTile(
                              title: Text(r['title'] ?? '', style: ts.bodyLarge?.copyWith(fontWeight: FontWeight.w500)),
                              subtitle: Text(
                                '${r['member_count'] ?? 0}人 · ${r['address'] ?? ""}',
                                style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant),
                              ),
                              trailing: Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
                              onTap: () => Navigator.pushNamed(context, '/circle-detail', arguments: r['id']),
                            );
                          },
                        ),
        ),
      ]),
    );
  }
}
