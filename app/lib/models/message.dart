class CircleMessage {
  final String id;
  final String circleId;
  final String userId;
  final Map<String, dynamic>? user;
  final String type; // text, image, system
  final String? content;
  final String? imageUrl;
  final bool isRecalled;
  final Map<String, dynamic>? recallSnapshot;
  final DateTime createdAt;

  CircleMessage({
    required this.id,
    required this.circleId,
    required this.userId,
    this.user,
    required this.type,
    this.content,
    this.imageUrl,
    this.isRecalled = false,
    this.recallSnapshot,
    required this.createdAt,
  });

  factory CircleMessage.fromJson(Map<String, dynamic> json) => CircleMessage(
        id: json['id'],
        circleId: json['circle_id'],
        userId: json['user_id'],
        user: json['user'] as Map<String, dynamic>?,
        type: json['type'] ?? 'text',
        content: json['content'],
        imageUrl: json['image_url'],
        isRecalled: json['is_recalled'] ?? false,
        recallSnapshot: json['recall_snapshot'] != null
            ? Map<String, dynamic>.from(json['recall_snapshot'])
            : null,
        createdAt: DateTime.parse(json['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'circle_id': circleId,
        'user_id': userId,
        'type': type,
        'content': content,
        'image_url': imageUrl,
      };
}
