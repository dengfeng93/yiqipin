import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/circle.dart';
import 'time_label.dart';

class CircleCard extends StatelessWidget {
  final Circle circle;
  final VoidCallback onJoin;
  final VoidCallback onDetail;
  final VoidCallback onSkip;
  final bool showHints;

  const CircleCard({
    super.key,
    required this.circle,
    required this.onJoin,
    required this.onDetail,
    required this.onSkip,
    this.showHints = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ts = Theme.of(context).textTheme;

    return GestureDetector(
      onVerticalDragEnd: (details) {
        if ((details.primaryVelocity ?? 0) < -300) onJoin();
      },
      onHorizontalDragEnd: (details) {
        if ((details.primaryVelocity ?? 0) > 300) {
          onDetail();
        } else if ((details.primaryVelocity ?? 0) < -300) {
          onSkip();
        }
      },
      child: Card(
        margin: const EdgeInsets.all(AppSpacing.lg),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(circle.title, style: ts.headlineSmall, maxLines: 2, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: AppSpacing.md),
                if (circle.distance != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 4),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text('${circle.distance!.toStringAsFixed(1)}km',
                        style: ts.labelMedium?.copyWith(color: cs.primary)),
                  ),
              ]),
              const SizedBox(height: AppSpacing.md),
              Row(children: [
                TimeLabel(label: circle.timeLabel, color: circle.timeLabelColor),
                const SizedBox(width: AppSpacing.md),
                Icon(Icons.people_outline, size: 14, color: cs.onSurfaceVariant),
                const SizedBox(width: 4),
                Text('${circle.memberCount}/${circle.maxMembers}人',
                    style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                const Spacer(),
                Icon(Icons.location_on_outlined, size: 14, color: cs.onSurfaceVariant),
                const SizedBox(width: 2),
                Flexible(child: Text(circle.address ?? '', style: ts.bodySmall?.copyWith(color: cs.onSurfaceVariant), overflow: TextOverflow.ellipsis)),
              ]),
              if (circle.prepTime > 0) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.timer_outlined, size: 14, color: AppColors.warning),
                    const SizedBox(width: 4),
                    Text('发起人准备中 · ${circle.prepTime}分钟',
                        style: ts.labelSmall?.copyWith(color: AppColors.warning)),
                  ]),
                ),
              ],
              const Spacer(),
              AnimatedOpacity(
                opacity: showHints ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 300),
                child: Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.md),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _hint(Icons.arrow_back, '跳过', cs),
                      _hint(Icons.arrow_upward, '加入', cs),
                      _hint(Icons.arrow_forward, '查看', cs),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _hint(IconData icon, String label, ColorScheme cs) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: cs.onSurfaceVariant.withOpacity(0.4)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant.withOpacity(0.4))),
      ],
    );
  }
}
