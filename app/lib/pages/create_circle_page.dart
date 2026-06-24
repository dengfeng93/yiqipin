import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../providers/location_provider.dart';

class CreateCirclePage extends ConsumerStatefulWidget {
  const CreateCirclePage({super.key});
  @override
  ConsumerState<CreateCirclePage> createState() => _CreateCirclePageState();
}

class _CreateCirclePageState extends ConsumerState<CreateCirclePage> {
  final _api = ApiService();
  int _step = 1;

  String? _selectedCategoryId;
  String? _selectedCategoryName;
  List<Map<String, dynamic>> _categories = [];

  String _startType = 'now';
  int _prepTime = 15;
  int _maxMembers = 10;
  String _address = '';
  String _restrictTag = 'all';
  String _groupRule = '';

  String _title = '';
  String _description = '';

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final res = await _api.get('/categories');
    setState(() => _categories =
        List<Map<String, dynamic>>.from(res.data['data'] ?? []));
  }

  void _publish() async {
    final loc = ref.read(locationProvider);
    try {
      final res = await _api.post('/circles', data: {
        'category_id': _selectedCategoryId,
        'title': _title,
        'description': _description,
        'lat': loc.lat,
        'lng': loc.lng,
        'address': _address,
        'max_members': _maxMembers,
        'start_type': _startType,
        'prep_time': _prepTime,
        'restrict_tag': _restrictTag,
        'group_rule': _groupRule,
      });
      final circleId = res.data['data']['id'];
      Navigator.pushReplacementNamed(context, '/circle-detail',
          arguments: circleId);
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('发布失败: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('创建圈子 — 第$_step步')),
      body: _step == 1
          ? _buildStep1()
          : _step == 2
              ? _buildStep2()
              : _buildStep3(),
      bottomNavigationBar: _step > 1
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(children: [
                  Expanded(
                      child: OutlinedButton(
                          onPressed: () => setState(() => _step--),
                          child: const Text('上一步'))),
                  const SizedBox(width: 16),
                  Expanded(
                      child: FilledButton(
                    onPressed: _step == 3
                        ? _publish
                        : () => setState(() => _step++),
                    child: Text(_step == 3 ? '确认发布' : '下一步'),
                  )),
                ]),
              ))
          : null,
    );
  }

  Widget _buildStep1() {
    final icons = {
      'basketball': Icons.sports_basketball,
      'football': Icons.sports_soccer,
      'badminton': Icons.sports_tennis,
      'running': Icons.directions_run,
      'board_game': Icons.extension,
      'dinner': Icons.restaurant,
      'movie': Icons.movie,
      'coffee': Icons.local_cafe,
      'study': Icons.menu_book,
      'travel': Icons.flight,
      'singing': Icons.music_note,
      'shopping': Icons.shopping_bag,
      'pet': Icons.pets,
      'fitness': Icons.fitness_center,
      'photo': Icons.camera_alt,
      'other': Icons.more_horiz,
    };

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4, mainAxisSpacing: 12, crossAxisSpacing: 12),
      itemCount: _categories.length,
      itemBuilder: (_, i) {
        final cat = _categories[i];
        final icon = icons[cat['icon']] ?? Icons.circle;
        final selected = _selectedCategoryId == cat['id'];
        return GestureDetector(
          onTap: () => setState(() {
            _selectedCategoryId = cat['id'];
            _selectedCategoryName = cat['name'];
            _maxMembers = cat['default_size'] ?? 10;
            _step = 2;
          }),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            CircleAvatar(
                radius: 28,
                backgroundColor:
                    selected ? Colors.orange : Colors.grey[200],
                child: Icon(icon,
                    color: selected ? Colors.white : Colors.grey[700])),
            const SizedBox(height: 4),
            Text(cat['name'],
                style: TextStyle(
                    fontSize: 12,
                    color: selected ? Colors.orange : Colors.black87)),
          ]),
        );
      },
    );
  }

  Widget _buildStep2() {
    return ListView(padding: const EdgeInsets.all(16), children: [
      const Text('活动时间',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      SegmentedButton<String>(
        segments: const [
          ButtonSegment(value: 'now', label: Text('现在')),
          ButtonSegment(value: 'today', label: Text('今天')),
          ButtonSegment(value: 'tomorrow', label: Text('明天')),
        ],
        selected: {_startType},
        onSelectionChanged: (v) => setState(() => _startType = v.first),
      ),
      const SizedBox(height: 20),
      const Text('准备时间',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      SegmentedButton<int>(
        segments: const [
          ButtonSegment(value: 5, label: Text('5分钟')),
          ButtonSegment(value: 15, label: Text('15分钟')),
          ButtonSegment(value: 30, label: Text('30分钟')),
        ],
        selected: {_prepTime},
        onSelectionChanged: (v) => setState(() => _prepTime = v.first),
      ),
      const SizedBox(height: 20),
      const Text('活动地点',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      TextField(
        decoration: const InputDecoration(
            hintText: '自动定位，可手动修改',
            border: OutlineInputBorder()),
        onChanged: (v) => _address = v,
      ),
      const SizedBox(height: 20),
      const Text('人数上限',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      Row(children: [
        IconButton(
            onPressed: () => setState(() {
                  if (_maxMembers > 2) _maxMembers -= 2;
                }),
            icon: const Icon(Icons.remove_circle_outline)),
        Text('$_maxMembers',
            style: const TextStyle(
                fontSize: 24, fontWeight: FontWeight.bold)),
        IconButton(
            onPressed: () => setState(() {
                  if (_maxMembers < 100) _maxMembers += 2;
                }),
            icon: const Icon(Icons.add_circle_outline)),
      ]),
      const SizedBox(height: 20),
      const Text('限定标签',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      SegmentedButton<String>(
        segments: const [
          ButtonSegment(value: 'all', label: Text('不限')),
          ButtonSegment(value: 'female_only', label: Text('仅女性')),
          ButtonSegment(value: 'newbie_only', label: Text('仅新手')),
        ],
        selected: {_restrictTag},
        onSelectionChanged: (v) => setState(() => _restrictTag = v.first),
      ),
      if (_selectedCategoryName == '拼奶茶' ||
          _selectedCategoryName == '拼外卖' ||
          _selectedCategoryName == '拼车')
        Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('拼单规则（必填）',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.red)),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: const InputDecoration(
                        hintText: '如：到货后群内发AA收款码',
                        border: OutlineInputBorder()),
                    onChanged: (v) => _groupRule = v,
                  ),
                ])),
    ]);
  }

  Widget _buildStep3() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('确认发布',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(children: [
              const Text('类型: '),
              Text(_selectedCategoryName ?? '')
            ]),
            const SizedBox(height: 8),
            TextField(
              decoration: const InputDecoration(
                  labelText: '圈子标题', border: OutlineInputBorder()),
              onChanged: (v) => _title = v,
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: const InputDecoration(
                  labelText: '描述（可选）',
                  border: OutlineInputBorder()),
              maxLines: 3,
              onChanged: (v) => _description = v,
            ),
            const SizedBox(height: 16),
            _buildSummaryRow('时间',
                _startType == 'now' ? '现在' : _startType == 'today' ? '今天' : '明天'),
            _buildSummaryRow('准备', '${_prepTime}分钟'),
            _buildSummaryRow('人数', '$_maxMembers人'),
          ]),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Text('$label: ', style: const TextStyle(color: Colors.grey)),
        Text(value)
      ]),
    );
  }
}
