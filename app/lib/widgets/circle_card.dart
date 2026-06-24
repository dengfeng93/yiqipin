import 'package:flutter/material.dart';
import '../models/circle.dart';
import 'time_label.dart';

class CircleCard extends StatelessWidget {
  final Circle circle;
  final VoidCallback onJoin;
  final VoidCallback onDetail;
  final VoidCallback onSkip;

  const CircleCard({
    super.key,
    required this.circle,
    required this.onJoin,
    required this.onDetail,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragEnd: (details) {
        if (details.primaryVelocity! < -300) onJoin();
      },
      onHorizontalDragEnd: (details) {
        if (details.primaryVelocity! > 300) {
          onDetail();
        } else if (details.primaryVelocity! < -300) {
          onSkip();
        }
      },
      child: Card(
        margin: const EdgeInsets.all(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(circle.title,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
                const Spacer(),
                Text(circle.distance != null
                    ? '${circle.distance!.toStringAsFixed(1)}km'
                    : ''),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                TimeLabel(
                    label: circle.timeLabel, color: circle.timeLabelColor),
                const SizedBox(width: 12),
                Text('${circle.memberCount}/${circle.maxMembers}人'),
                const Spacer(),
                Text(circle.address ?? ''),
              ]),
              if (circle.prepTime > 0)
                const Chip(
                    label: Text('🏠 发起人准备中'),
                    backgroundColor: Color(0xFFFFF3E0)),
            ],
          ),
        ),
      ),
    );
  }
}
