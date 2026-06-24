import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
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

  final _iconMap = const {
    'basketball': Icons.sports_basketball, 'football': Icons.sports_soccer,
    'badminton': Icons.sports_tennis, 'running': Icons.directions_run,
    'board_game': Icons.extension, 'dinner': Icons.restaurant,
    'movie': Icons.movie, 'coffee': Icons.local_cafe,
    'study': Icons.menu_book, 'travel': Icons.flight,
    'singing': Icons.music_note, 'shopping': Icons.shopping_bag,
    'pet': Icons.pets, 'fitness': Icons.fitness_center,
    'photo': Icons.camera_alt, 'other': Icons.more_horiz,
  };

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await _api.get('/categories');
      if (mounted) setState(() => _categories = List<Map<String, dynamic>>.from(res.data['data'] ?? []));
    } catch (_) {
      if (mounted) setState(() => _categories = []);
    }
  }

  Future<void> _publish() async {
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请先选择活动类型'), backgroundColor: AppColors.error),
      );
      return;
    }
    if (_title.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入圈子标题'), backgroundColor: AppColors.error),
      );
      return;
    }
    final loc = ref.read(locationProvider);
    if (loc.lat == null || loc.lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('无法获取位置信息'), backgroundColor: AppColors.error),
      );
      return;
    }
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
      if (mounted) Navigator.pushReplacementNamed(context, '/circle-detail', arguments: circleId);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('发布失败: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: Text('创建圈子 — 第$_step步')),
      body: _step == 1 ? _buildStep1(cs) : _step == 2 ? _buildStep2(cs, ts) : _buildStep3(cs, ts),
      bottomNavigationBar: _step > 1
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _step--),
                      child: const Text('上一步'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.lg),
                  Expanded(
                    child: FilledButton(
                      onPressed: _step == 3 ? _publish : () => setState(() => _step++),
                      child: Text(_step == 3 ? '确认发布' : '下一步'),
                    ),
                  ),
                ]),
              ),
            )
          : null,
    );
  }

  Widget _buildStep1(ColorScheme cs) {
    return GridView.builder(
      padding: const EdgeInsets.all(AppSpacing.lg),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4, mainAxisSpacing: AppSpacing.md, crossAxisSpacing: AppSpacing.md,
      ),
      itemCount: _categories.length,
      itemBuilder: (_, i) {
        final cat = _categories[i];
        final icon = _iconMap[cat['icon']] ?? Icons.circle;
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
              backgroundColor: selected ? cs.primary : cs.surfaceContainerHighest,
              child: Icon(icon, color: selected ? cs.onPrimary : cs.onSurfaceVariant, size: 24),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              cat['name'] ?? '',
              style: TextStyle(fontSize: 12, color: selected ? cs.primary : cs.onSurface),
            ),
          ]),
        );
      },
    );
  }

  Widget _buildStep2(ColorScheme cs, TextTheme ts) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        _sectionTitle('活动时间', ts),
        const SizedBox(height: AppSpacing.sm),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'now', label: Text('现在')),
            ButtonSegment(value: 'today', label: Text('今天')),
            ButtonSegment(value: 'tomorrow', label: Text('明天')),
          ],
          selected: {_startType},
          onSelectionChanged: (v) => setState(() => _startType = v.first),
        ),
        const SizedBox(height: AppSpacing.xl),
        _sectionTitle('准备时间', ts),
        const SizedBox(height: AppSpacing.sm),
        SegmentedButton<int>(
          segments: const [
            ButtonSegment(value: 5, label: Text('5分钟')),
            ButtonSegment(value: 15, label: Text('15分钟')),
            ButtonSegment(value: 30, label: Text('30分钟')),
          ],
          selected: {_prepTime},
          onSelectionChanged: (v) => setState(() => _prepTime = v.first),
        ),
        const SizedBox(height: AppSpacing.xl),
        _sectionTitle('活动地点', ts),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          decoration: const InputDecoration(hintText: '自动定位，可手动修改'),
          onChanged: (v) => _address = v,
        ),
        const SizedBox(height: AppSpacing.xl),
        _sectionTitle('人数上限', ts),
        const SizedBox(height: AppSpacing.sm),
        Row(children: [
          IconButton(
            onPressed: () => setState(() { if (_maxMembers > 2) _maxMembers -= 2; }),
            icon: const Icon(Icons.remove_circle_outline),
          ),
          Text('$_maxMembers', style: ts.headlineSmall),
          IconButton(
            onPressed: () => setState(() { if (_maxMembers < 100) _maxMembers += 2; }),
            icon: const Icon(Icons.add_circle_outline),
          ),
        ]),
        const SizedBox(height: AppSpacing.xl),
        _sectionTitle('限定标签', ts),
        const SizedBox(height: AppSpacing.sm),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'all', label: Text('不限')),
            ButtonSegment(value: 'female_only', label: Text('仅女性')),
            ButtonSegment(value: 'newbie_only', label: Text('仅新手')),
          ],
          selected: {_restrictTag},
          onSelectionChanged: (v) => setState(() => _restrictTag = v.first),
        ),
        if (_selectedCategoryName == '拼奶茶' || _selectedCategoryName == '拼外卖' || _selectedCategoryName == '拼车')
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.xl),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _sectionTitle('拼单规则（必填）', ts, color: cs.error),
              const SizedBox(height: AppSpacing.sm),
              TextField(
                decoration: const InputDecoration(hintText: '如：到货后群内发AA收款码'),
                onChanged: (v) => _groupRule = v,
              ),
            ]),
          ),
      ],
    );
  }

  Widget _buildStep3(ColorScheme cs, TextTheme ts) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('确认发布', style: ts.titleLarge),
        const SizedBox(height: AppSpacing.lg),
        _summaryRow('类型', _selectedCategoryName ?? '', cs, ts),
        const SizedBox(height: AppSpacing.md),
        TextField(
          decoration: const InputDecoration(labelText: '圈子标题'),
          onChanged: (v) => _title = v,
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          decoration: const InputDecoration(labelText: '描述（可选）'),
          maxLines: 3,
          onChanged: (v) => _description = v,
        ),
        const SizedBox(height: AppSpacing.lg),
        _summaryRow('时间', _startType == 'now' ? '现在' : _startType == 'today' ? '今天' : '明天', cs, ts),
        _summaryRow('准备', '${_prepTime}分钟', cs, ts),
        _summaryRow('人数', '$_maxMembers人', cs, ts),
      ]),
    );
  }

  Widget _sectionTitle(String title, TextTheme ts, {Color? color}) {
    return Text(title, style: ts.titleMedium?.copyWith(color: color));
  }

  Widget _summaryRow(String label, String value, ColorScheme cs, TextTheme ts) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Text('$label: ', style: ts.bodyMedium?.copyWith(color: cs.onSurfaceVariant)),
        Text(value, style: ts.bodyMedium),
      ]),
    );
  }
}
