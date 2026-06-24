class UserStats {
  final int totalCreated;
  final int totalJoined;
  final double showupRate;

  UserStats({
    this.totalCreated = 0,
    this.totalJoined = 0,
    this.showupRate = 0.0,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) => UserStats(
        totalCreated: json['total_created'] ?? 0,
        totalJoined: json['total_joined'] ?? 0,
        showupRate: (json['showup_rate'] ?? 0).toDouble(),
      );
}

class User {
  final String id;
  final String nickname;
  final String? avatar;
  final String? phone;
  final List<String> interests;
  final String role;
  final bool isIncognito;
  final DateTime? mutedUntil;
  final int credit;
  final UserStats? stats;
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
    this.credit = 100,
    this.stats,
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
        credit: json['credit'] ?? 100,
        stats: json['stats'] != null
            ? UserStats.fromJson(json['stats'])
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
