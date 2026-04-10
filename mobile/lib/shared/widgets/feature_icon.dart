import 'package:flutter/material.dart';
import '../../config/theme/design_system.dart';

class FeatureIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  final double iconSize;
  final LinearGradient? gradient;

  const FeatureIcon({
    super.key,
    required this.icon,
    required this.color,
    this.size = 44,
    this.iconSize = 22,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: gradient,
        color: gradient == null
            ? color.withValues(alpha: isDark ? 0.15 : 0.1)
            : null,
        borderRadius: BorderRadius.circular(DesignSystem.radiusMd),
      ),
      child: Icon(
        icon,
        color: gradient != null ? Colors.white : color,
        size: iconSize,
      ),
    );
  }
}
