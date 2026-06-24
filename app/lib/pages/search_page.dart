import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../providers/location_provider.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});
  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final _api = ApiService();
  List<Map<String, dynamic>> _results = [];
  List<Map<String, dynamic>> _categories = [];
  String? _selectedCategory;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final res = await _api.get('/categories');
    setState(() => _categories = List<Map<String, dynamic>>.from(
        res.data['data'] ?? []));
  }

  Future<void> _search(String q) async {
    if (q.trim().isEmpty) return;
    setState(() => _loading = true);
    final loc = ref.read(locationProvider);
    final params = <String, dynamic>{'q': q};
    if (loc.lat != null && loc.lng != null) {
      params['lat'] = loc.lat;
      params['lng'] = loc.lng;
    }
    final res = await _api.get('/search', params: params);
    setState(() {
      _results = List<Map<String, dynamic>>.from(
          res.data['data'] ?? []);
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: TextField(
        autofocus: true,
        decoration: const InputDecoration(
            hintText: '搜索圈子...', border: InputBorder.none),
        onSubmitted: _search,
      )),
      body: Column(children: [
        SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding:
                  const EdgeInsets.symmetric(horizontal: 8),
              children: _categories
                  .map((c) => Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 4),
                        child: FilterChip(
                          label: Text(c['name']),
                          selected:
                              _selectedCategory == c['id'],
                          onSelected: (v) => setState(() {
                            _selectedCategory =
                                v ? c['id'] : null;
                          }),
                        ),
                      ))
                  .toList(),
            )),
        Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (_, i) {
                      final r = _results[i];
                      return ListTile(
                        title: Text(r['title'] ?? ''),
                        subtitle: Text(
                            '${r['member_count'] ?? 0}人 · ${r['address'] ?? ""}'),
                        trailing: const Icon(
                            Icons.chevron_right),
                        onTap: () => Navigator.pushNamed(
                            context, '/circle-detail',
                            arguments: r['id']),
                      );
                    },
                  )),
      ]),
    );
  }
}
