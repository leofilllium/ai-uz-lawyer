import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../config/theme/app_colors.dart';
import '../../../config/theme/app_text_styles.dart';
import '../../../config/theme/design_system.dart';

class MarkdownStyler {
  static MarkdownStyleSheet getStyle(BuildContext context,
      {bool isUser = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isUser
        ? Colors.white
        : (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary);
    final secondaryColor = isUser
        ? Colors.white70
        : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary);

    return MarkdownStyleSheet(
      p: AppTextStyles.bodyMedium.copyWith(color: textColor),
      h1: AppTextStyles.heading1.copyWith(color: textColor),
      h2: AppTextStyles.heading2.copyWith(color: textColor),
      h3: AppTextStyles.heading3.copyWith(color: textColor),
      h1Padding: const EdgeInsets.only(top: 8, bottom: 4),
      h2Padding: const EdgeInsets.only(top: 6, bottom: 3),
      h3Padding: const EdgeInsets.only(top: 4, bottom: 2),
      listBullet: AppTextStyles.bodyMedium.copyWith(color: textColor),
      blockquote: AppTextStyles.bodyMedium.copyWith(
        color: secondaryColor,
        fontStyle: FontStyle.italic,
      ),
      blockquoteDecoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.black.withValues(alpha: 0.03),
        border: Border(
          left: BorderSide(
            color: isUser
                ? Colors.white.withValues(alpha: 0.4)
                : (isDark ? AppColors.darkPrimary : AppColors.primary),
            width: 3,
          ),
        ),
        borderRadius: const BorderRadius.only(
          topRight: Radius.circular(6),
          bottomRight: Radius.circular(6),
        ),
      ),
      blockquotePadding: const EdgeInsets.symmetric(
        horizontal: DesignSystem.spacingMd,
        vertical: DesignSystem.spacingSm,
      ),
      code: TextStyle(
        fontFamily: 'monospace',
        fontSize: 13,
        color: isUser
            ? Colors.white
            : (isDark ? AppColors.accentOrange : AppColors.primary),
        backgroundColor: Colors.transparent,
      ),
      codeblockDecoration: BoxDecoration(
        color: isDark
            ? Colors.black.withValues(alpha: 0.35)
            : AppColors.borderLight,
        borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : AppColors.border.withValues(alpha: 0.5),
        ),
      ),
      codeblockPadding: const EdgeInsets.all(DesignSystem.spacingMd),
      tableBorder: TableBorder.all(
        color: isDark ? Colors.white.withValues(alpha: 0.12) : AppColors.border,
        width: 1,
        borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
      ),
      tableBody: AppTextStyles.bodySmall.copyWith(color: textColor),
      tableHead: AppTextStyles.label.copyWith(
        color: textColor,
        fontWeight: FontWeight.w600,
      ),
      tableCellsPadding: const EdgeInsets.symmetric(
        horizontal: DesignSystem.spacingSm,
        vertical: DesignSystem.spacingXs,
      ),
      horizontalRuleDecoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color:
                isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.border,
          ),
        ),
      ),
    );
  }
}
