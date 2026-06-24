class User {
  final String id;
  final String nickname;
  final String? avatar;
  final String? phone;
  final List<String> interests;
  final String role;
  final bool isIncognito;
  final DateTime? mutedUntil;
  final DateTime createdAt;

  User({
    required this.id,
    required this.nickname,
    this.avatar,
    this.phone,
    this.interests = const [],
    this.role = 'user',
    this.isIncognito = false,
    this.mutedUntil,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'],
        nickname: json['nickname'] ?? '',
        avatar: json['avatar'],
        phone: json['phone'],
        interests: (json['interests'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        role: json['role'] ?? 'user',
        isIncognito: json['is_incognito'] ?? false,
        mutedUntil: json['muted_until'] != null
            ? DateTime.tryParse(json['muted_until'])
            : null,
        createdAt: DateTime.parse(json['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'nickname': nickname,
        'avatar': avatar,
        'phone': phone,
        'interests': interests,
        'role': role,
        'is_incognito': isIncognito,
      };
}
