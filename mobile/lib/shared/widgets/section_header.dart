import 'package:flutter/material.dart';
import '../../config/theme/app_colors.dart';
import '../../config/theme/app_text_styles.dart';
import '../../config/theme/design_system.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionText;
  final VoidCallback? onAction;
  final IconData? icon;
  final Color? iconColor;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionText,
    this.onAction,
    this.icon,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: Row(
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: (iconColor ?? AppColors.primary).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
              ),
              child: Icon(
                icon,
                size: 16,
                color: iconColor ??
                    (isDark ? AppColors.darkPrimary : AppColors.primary),
              ),
            ),
            const SizedBox(width: DesignSystem.spacingSm),
          ],
          Flexible(
            child: Text(
              title,
              style: AppTextStyles.heading2.copyWith(
                color:
                    isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
          const SizedBox(width: DesignSystem.spacingSm),
          if (actionText != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    actionText!,
                    style: AppTextStyles.label.copyWith(
                      color: isDark ? AppColors.darkPrimary : AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 10,
                    color: isDark ? AppColors.darkPrimary : AppColors.primary,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
