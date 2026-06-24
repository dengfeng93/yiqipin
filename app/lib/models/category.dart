class Category {
  final String id;
  final String name;
  final String icon;
  final String? parentId;
  final int sort;
  final int defaultMaxMembers;
  final int wishThreshold;

  Category({
    required this.id,
    required this.name,
    required this.icon,
    this.parentId,
    this.sort = 0,
    this.defaultMaxMembers = 100,
    this.wishThreshold = 3,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'],
        name: json['name'],
        icon: json['icon'],
        parentId: json['parent_id'],
        sort: json['sort'] ?? 0,
        defaultMaxMembers: json['default_max_members'] ?? 100,
        wishThreshold: json['wish_threshold'] ?? 3,
      );
}
