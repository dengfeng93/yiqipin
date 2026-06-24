import 'package:flutter/material.dart';

class Circle {
  final String id;
  final String creatorId;
  final String categoryId;
  final String title;
  final String? description;
  final String? address;
  final double? distance;
  final int maxMembers;
  final int memberCount;
  final DateTime startTime;
  final String startType;
  final int prepTime;
  final String status;
  final String restrictTag;
  final String? groupRule;
  final DateTime createdAt;

  Circle({
    required this.id,
    required this.creatorId,
    required this.categoryId,
    required this.title,
    this.description,
    this.address,
    this.distance,
    required this.maxMembers,
    this.memberCount = 0,
    required this.startTime,
    required this.startType,
    this.prepTime = 0,
    required this.status,
    this.restrictTag = 'all',
    this.groupRule,
    required this.createdAt,
  });

  factory Circle.fromJson(Map<String, dynamic> json) => Circle(
        id: json['id'],
        creatorId: json['creator_id'],
        categoryId: json['category_id'],
        title: json['title'],
        description: json['description'],
        address: json['address'],
        distance: (json['distance'] as num?)?.toDouble(),
        memberCount: json['member_count'] ?? 0,
        maxMembers: json['max_members'] ?? 100,
        startTime: DateTime.parse(json['start_time']),
        startType: json['start_type'] ?? 'now',
        prepTime: json['prep_time'] ?? 0,
        status: json['status'] ?? 'active',
        restrictTag: json['restrict_tag'] ?? 'all',
        groupRule: json['group_rule'],
        createdAt: DateTime.parse(json['created_at']),
      );

  String get timeLabel {
    final diff = startTime.difference(DateTime.now());
    if (diff.inMinutes <= 60) return '🔥 即将开始';
    if (diff.inHours <= 6) return '☀️ 今天';
    return '📅 计划中';
  }

  Color get timeLabelColor {
    final diff = startTime.difference(DateTime.now());
    if (diff.inMinutes <= 60) return Colors.red;
    if (diff.inHours <= 6) return Colors.orange;
    return Colors.blue;
  }
}
