import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../../shared/utils/markdown_styler.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../domain/entities/contract_analysis.dart';

class AnalysisResultView extends StatelessWidget {
  final ContractAnalysis analysis;

  const AnalysisResultView({super.key, required this.analysis});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildScoreCard(context),
          const SizedBox(height: DesignSystem.spacingXl),

          // Strengths
          if (analysis.strengths.isNotEmpty) ...[
            const SectionHeader(
              title: 'Сильные стороны',
              icon: Icons.check_circle_outline_rounded,
              iconColor: AppColors.success,
            ),
            ...analysis.strengths.map((s) => _buildStrengthItem(context, s)),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Critical Errors
          if (analysis.criticalErrors.isNotEmpty) ...[
            const SectionHeader(
              title: 'Критические Ошибки',
              icon: Icons.error_outline_rounded,
              iconColor: AppColors.error,
            ),
            ...analysis.criticalErrors.map((e) => _buildErrorItem(context, e)),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Hidden Risks
          if (analysis.hiddenRisks.isNotEmpty) ...[
            const SectionHeader(
              title: 'Скрытые Риски',
              icon: Icons.visibility_off_outlined,
              iconColor: AppColors.accentOrange,
            ),
            ...analysis.hiddenRisks
                .map((e) => _buildTextItem(context, e, AppColors.accentOrange)),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Ambiguities
          if (analysis.ambiguities.isNotEmpty) ...[
            const SectionHeader(
              title: 'Размытые Формулировки',
              icon: Icons.help_outline_rounded,
              iconColor: AppColors.accentIndigo,
            ),
            ...analysis.ambiguities
                .map((e) => _buildTextItem(context, e, AppColors.accentIndigo)),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Warnings
          if (analysis.warnings.isNotEmpty) ...[
            const SectionHeader(
              title: 'Предупреждения',
              icon: Icons.warning_amber_rounded,
              iconColor: AppColors.warning,
            ),
            ...analysis.warnings.map((e) => _buildWarningItem(context, e)),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Missing Clauses
          if (analysis.missingClauses.isNotEmpty) ...[
            const SectionHeader(
              title: 'Недостающие Пункты',
              icon: Icons.playlist_add_rounded,
              iconColor: AppColors.accentBlue,
            ),
            ...analysis.missingClauses
                .map((e) => _buildMissingClauseItem(context, e)),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Improvement Suggestions
          if (analysis.improvementSuggestions.isNotEmpty) ...[
            const SectionHeader(
              title: 'Рекомендации по Улучшению',
              icon: Icons.lightbulb_outline_rounded,
              iconColor: AppColors.accentTeal,
            ),
            ...analysis.improvementSuggestions
                .map((e) => _buildImprovementItem(context, e)),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Negotiation Strategy
          if (analysis.negotiationStrategy != null &&
              analysis.negotiationStrategy!.isNotEmpty) ...[
            const SectionHeader(
              title: 'Стратегия Переговоров',
              icon: Icons.handshake_outlined,
              iconColor: AppColors.primary,
            ),
            GlassCard(
              child: MarkdownBody(
                data: analysis.negotiationStrategy!,
                styleSheet: MarkdownStyler.getStyle(context),
              ),
            ),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Summary
          const SectionHeader(
            title: 'Заключение',
            icon: Icons.summarize_rounded,
            iconColor: AppColors.accentTeal,
          ),
          GlassCard(
            child: MarkdownBody(
              data: analysis.summary,
              styleSheet: MarkdownStyler.getStyle(context),
            ),
          ),
          const SizedBox(height: DesignSystem.spacingXl),

          // Sources
          if (analysis.sources.isNotEmpty) ...[
            const SectionHeader(
              title: 'Правовая Основа',
              icon: Icons.menu_book_rounded,
              iconColor: AppColors.accentBlue,
            ),
            ...analysis.sources.map((s) => _buildSourceItem(context, s)),
          ],

          const SizedBox(height: DesignSystem.spacing4xl),
        ],
      ),
    );
  }

  Widget _buildScoreCard(BuildContext context) {
    final colors = context.colors;
    final score = analysis.validityScore;
    Color scoreColor;
    String verdict;
    IconData verdictIcon;

    if (score >= 80) {
      scoreColor = AppColors.success;
      verdict = 'КОРРЕКТЕН';
      verdictIcon = Icons.check_circle_outline_rounded;
    } else if (score >= 60) {
      scoreColor = AppColors.warning;
      verdict = 'ТРЕБУЕТ ДОРАБОТКИ';
      verdictIcon = Icons.warning_amber_rounded;
    } else if (score >= 40) {
      scoreColor = AppColors.accentOrange;
      verdict = 'РИСКОВАНО';
      verdictIcon = Icons.report_problem_outlined;
    } else {
      scoreColor = AppColors.error;
      verdict = 'КРИТИЧЕСКИ ОПАСНО';
      verdictIcon = Icons.dangerous_outlined;
    }

    return GlassCard(
      accentColor: scoreColor,
      padding: const EdgeInsets.all(DesignSystem.spacingXl),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 90,
                height: 90,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 90,
                      height: 90,
                      child: CircularProgressIndicator(
                        value: score / 100,
                        strokeWidth: 6,
                        strokeCap: StrokeCap.round,
                        backgroundColor: scoreColor.withValues(alpha: 0.12),
                        color: scoreColor,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$score',
                          style: AppTextStyles.displayMedium
                              .copyWith(color: scoreColor, fontSize: 32),
                        ),
                        Text(
                          '/100',
                          style: AppTextStyles.caption.copyWith(
                            color: colors.onSurface.withValues(alpha: 0.5),
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: DesignSystem.spacingXl),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Оценка Действительности',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: colors.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(verdictIcon, color: scoreColor, size: 20),
                      const SizedBox(width: 6),
                      Text(
                        verdict,
                        style:
                            AppTextStyles.heading3.copyWith(color: scoreColor),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          if (analysis.scoreExplanation.isNotEmpty) ...[
            const SizedBox(height: DesignSystem.spacingBase),
            Text(
              analysis.scoreExplanation,
              style: AppTextStyles.bodySmall.copyWith(
                color: colors.onSurface.withValues(alpha: 0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStrengthItem(BuildContext context, String text) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingSm),
      child: GlassCard(
        accentColor: AppColors.success,
        padding: const EdgeInsets.symmetric(
          horizontal: DesignSystem.spacingBase,
          vertical: DesignSystem.spacingMd,
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle_rounded,
                color: AppColors.success, size: 20),
            const SizedBox(width: DesignSystem.spacingMd),
            Expanded(
              child: Text(text,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: colors.onSurface,
                  )),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorItem(BuildContext context, ValidationError error) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: GlassCard(
        accentColor: AppColors.error,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(error.error,
                style: AppTextStyles.heading3
                    .copyWith(color: AppColors.error, fontSize: 15)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(DesignSystem.chipRadius),
              ),
              child: Text(
                'Ст. ${error.article}',
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.error,
                ),
              ),
            ),
            Divider(color: colors.outlineVariant, height: 20),
            Text('Рекомендуемое Исправление',
                style: AppTextStyles.label.copyWith(
                  fontWeight: FontWeight.w600,
                  color: colors.onSurface.withValues(alpha: 0.7),
                )),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingMd),
              width: double.infinity,
              decoration: BoxDecoration(
                color: colors.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
              ),
              child: Text(error.fix,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12,
                    height: 1.5,
                    color: colors.onSurface,
                  )),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWarningItem(BuildContext context, ValidationWarning warning) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: GlassCard(
        accentColor: AppColors.warning,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(warning.risk,
                style: AppTextStyles.heading3
                    .copyWith(color: AppColors.warningDark, fontSize: 15)),
            const SizedBox(height: 4),
            Text(warning.explanation,
                style: AppTextStyles.bodySmall.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.7),
                )),
            Divider(color: colors.outlineVariant, height: 20),
            Text('Рекомендация',
                style: AppTextStyles.label.copyWith(
                  fontWeight: FontWeight.w600,
                  color: colors.onSurface.withValues(alpha: 0.7),
                )),
            const SizedBox(height: 4),
            Text(warning.suggestion,
                style: AppTextStyles.bodySmall.copyWith(
                  color: colors.onSurface,
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildMissingClauseItem(BuildContext context, MissingClause clause) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: GlassCard(
        accentColor: AppColors.accentBlue,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(clause.clauseName,
                style: AppTextStyles.heading3
                    .copyWith(color: AppColors.accentBlue, fontSize: 15)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.accentBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(DesignSystem.chipRadius),
              ),
              child: Text(
                'Основание: ${clause.articleReference}',
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.accentBlue,
                ),
              ),
            ),
            Divider(color: colors.outlineVariant, height: 20),
            Text('Текст для Добавления',
                style: AppTextStyles.label.copyWith(
                  fontWeight: FontWeight.w600,
                  color: colors.onSurface.withValues(alpha: 0.7),
                )),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingMd),
              width: double.infinity,
              decoration: BoxDecoration(
                color: colors.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
              ),
              child: Text(
                clause.draftedText,
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 12,
                  height: 1.5,
                  color: colors.onSurface,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImprovementItem(
      BuildContext context, ImprovementSuggestion item) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: GlassCard(
        accentColor: AppColors.accentTeal,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.suggestion,
                style: AppTextStyles.heading3
                    .copyWith(color: AppColors.accentTeal, fontSize: 15)),
            const SizedBox(height: 4),
            Text(item.reason,
                style: AppTextStyles.bodySmall.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.7),
                )),
            Divider(color: colors.outlineVariant, height: 20),
            Text('Текст для Добавления',
                style: AppTextStyles.label.copyWith(
                  fontWeight: FontWeight.w600,
                  color: colors.onSurface.withValues(alpha: 0.7),
                )),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingMd),
              width: double.infinity,
              decoration: BoxDecoration(
                color: colors.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
              ),
              child: Text(
                item.draftedText,
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 12,
                  height: 1.5,
                  color: colors.onSurface,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSourceItem(BuildContext context, AnalysisSource source) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingSm),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(
          horizontal: DesignSystem.spacingBase,
          vertical: DesignSystem.spacingMd,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    source.source,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: colors.onSurface,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accentBlue.withValues(alpha: 0.1),
                    borderRadius:
                        BorderRadius.circular(DesignSystem.chipRadius),
                  ),
                  child: Text(
                    'Ст. ${source.article}',
                    style: AppTextStyles.labelSmall.copyWith(
                      color: AppColors.accentBlue,
                    ),
                  ),
                ),
              ],
            ),
            if (source.preview != null && source.preview!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                source.preview!.length > 200
                    ? '${source.preview!.substring(0, 200)}...'
                    : source.preview!,
                style: AppTextStyles.caption.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.6),
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTextItem(BuildContext context, String text, Color accentColor) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: GlassCard(
        accentColor: accentColor,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 6,
              height: 6,
              margin: const EdgeInsets.only(top: 7),
              decoration: BoxDecoration(
                color: accentColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: DesignSystem.spacingMd),
            Expanded(
              child: Text(text,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: colors.onSurface,
                  )),
            ),
          ],
        ),
      ),
    );
  }
}
