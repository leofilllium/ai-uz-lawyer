import 'package:flutter/material.dart';
import '../../config/theme/app_text_styles.dart';
import '../../config/theme/design_system.dart';

class StatusBadge extends StatelessWidget {
  final String text;
  final Color color;
  final bool filled;

  const StatusBadge({
    super.key,
    required this.text,
    required this.color,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: filled ? color : color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(DesignSystem.chipRadius),
        border: filled ? null : Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        text,
        style: AppTextStyles.labelSmall.copyWith(
          color: filled ? Colors.white : color,
          fontSize: 11,
        ),
      ),
    );
  }
}
