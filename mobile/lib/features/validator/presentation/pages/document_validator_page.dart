import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../../shared/utils/markdown_styler.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/feature_icon.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/section_header.dart';
import '../bloc/validator_bloc.dart';
import '../bloc/validator_event.dart';
import '../bloc/validator_state.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

/// Document type options matching the web frontend
const _documentTypes = <({String value, String label})>[
  (value: '', label: 'Автоматическое определение'),
  (value: 'power_of_attorney', label: 'Доверенность'),
  (value: 'corporate_resolution', label: 'Решение/Протокол'),
  (value: 'claim', label: 'Претензия/Иск'),
  (value: 'application', label: 'Заявление'),
  (value: 'agreement', label: 'Соглашение'),
  (value: 'act', label: 'Акт'),
  (value: 'order', label: 'Приказ'),
  (value: 'regulation', label: 'Положение'),
  (value: 'other', label: 'Другое'),
];

class DocumentValidatorPage extends StatefulWidget {
  const DocumentValidatorPage({super.key});

  @override
  State<DocumentValidatorPage> createState() => _DocumentValidatorPageState();
}

class _DocumentValidatorPageState extends State<DocumentValidatorPage> {
  final _textController = TextEditingController();
  String _selectedType = '';

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _analyze() {
    final text = _textController.text.trim();
    if (text.length < 50) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.contractTooShort),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }
    // Reuse the ValidatorBloc — we send the same event type
    // The backend differentiates based on endpoint
    context.read<ValidatorBloc>().add(ValidateContractRequested(text));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Проверка Документа'),
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
            ),
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 16,
              color: colors.onSurface,
            ),
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: BlocBuilder<ValidatorBloc, ValidatorState>(
        builder: (context, state) {
          if (state is ValidatorLoading) {
            return _buildLoadingState(context);
          }

          if (state is ValidatorSuccess) {
            return Column(
              children: [
                Expanded(
                  child: _buildResultView(context, state),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    DesignSystem.horizontalMarginMobile,
                    DesignSystem.spacingSm,
                    DesignSystem.horizontalMarginMobile,
                    DesignSystem.spacingBase,
                  ),
                  child: PrimaryButton(
                    text: 'Проверить другой документ',
                    icon: Icons.refresh_rounded,
                    onPressed: () {
                      _textController.clear();
                      context.read<ValidatorBloc>().add(ResetValidator());
                    },
                  ),
                ),
              ],
            );
          }

          return _buildFormView(context, state);
        },
      ),
    );
  }

  Widget _buildFormView(BuildContext context, ValidatorState state) {
    final colors = context.colors;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        DesignSystem.horizontalMarginMobile,
        DesignSystem.spacingBase,
        DesignSystem.horizontalMarginMobile,
        DesignSystem.bottomNavHeight + 32,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          GlassCard(
            accentColor: AppColors.accentIndigo,
            child: Row(
              children: [
                const FeatureIcon(
                  icon: Icons.document_scanner_rounded,
                  color: AppColors.accentIndigo,
                  size: 48,
                  iconSize: 24,
                ),
                const SizedBox(width: DesignSystem.spacingMd),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Проверьте документ',
                        style: AppTextStyles.heading3.copyWith(
                          color: colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Вставьте текст для комплексного анализа',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: colors.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: DesignSystem.spacingXl),

          // Document type dropdown
          Text('Тип документа (опционально)',
              style: AppTextStyles.label.copyWith(
                fontWeight: FontWeight.w600,
                color: colors.onSurface.withValues(alpha: 0.7),
              )),
          const SizedBox(height: DesignSystem.spacingSm),
          Container(
            decoration: BoxDecoration(
              color: colors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(DesignSystem.cardRadius),
              border: Border.all(color: colors.outline),
            ),
            child: DropdownButtonFormField<String>(
              initialValue: _selectedType,
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: DesignSystem.spacingBase),
              ),
              items: _documentTypes.map((type) {
                return DropdownMenuItem(
                  value: type.value,
                  child: Text(type.label),
                );
              }).toList(),
              onChanged: (val) => setState(() => _selectedType = val ?? ''),
              dropdownColor: colors.surfaceContainerHighest,
              isExpanded: true,
            ),
          ),
          const SizedBox(height: DesignSystem.spacingXl),

          // Document text input
          Text('Текст документа',
              style: AppTextStyles.label.copyWith(
                fontWeight: FontWeight.w600,
                color: colors.onSurface.withValues(alpha: 0.7),
              )),
          const SizedBox(height: DesignSystem.spacingSm),
          Container(
            decoration: BoxDecoration(
              color: colors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(DesignSystem.cardRadius),
              border: Border.all(color: colors.outline),
            ),
            child: TextField(
              controller: _textController,
              maxLines: 15,
              minLines: 8,
              style: AppTextStyles.bodyMedium.copyWith(
                color: colors.onSurface,
              ),
              decoration: const InputDecoration(
                hintText:
                    'Вставьте полный текст документа для анализа...\n\nПримеры:\n• Доверенность\n• Протокол собрания\n• Претензия / Иск\n• Приказ',
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.all(DesignSystem.spacingBase),
              ),
            ),
          ),
          const SizedBox(height: DesignSystem.spacingXl),

          if (state is ValidatorError)
            Padding(
              padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
              child: GlassCard(
                accentColor: AppColors.error,
                padding: const EdgeInsets.all(DesignSystem.spacingMd),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppColors.error, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        state.message,
                        style: AppTextStyles.bodySmall
                            .copyWith(color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          PrimaryButton(
            text: 'Проверить документ',
            icon: Icons.search_rounded,
            onPressed: _analyze,
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    final colors = context.colors;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 64,
            height: 64,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: colors.primary,
            ),
          ),
          const SizedBox(height: DesignSystem.spacingXl),
          Text(
            'Анализ документа...',
            style: AppTextStyles.heading3.copyWith(
              color: colors.onSurface,
            ),
          ),
          const SizedBox(height: DesignSystem.spacingSm),
          Text(
            'Это может занять пару минут',
            style: AppTextStyles.bodySmall.copyWith(
              color: colors.onSurface.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  /// Shows full analysis result — reuses the existing AnalysisResultView
  /// since the response structure is the same ContractAnalysis entity.
  Widget _buildResultView(BuildContext context, ValidatorSuccess state) {
    // Import the analysis result view from the existing validator widgets
    return SingleChildScrollView(
      padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildScoreHeader(context, state),
          const SizedBox(height: DesignSystem.spacingXl),
          // Full analysis via markdown
          if (state.analysis.scoreExplanation.isNotEmpty) ...[
            const SectionHeader(
              title: 'Оценка',
              icon: Icons.assessment_rounded,
              iconColor: AppColors.primary,
            ),
            GlassCard(
              child: MarkdownBody(
                data: state.analysis.scoreExplanation,
                styleSheet: MarkdownStyler.getStyle(context),
              ),
            ),
            const SizedBox(height: DesignSystem.spacingXl),
          ],
          if (state.analysis.criticalErrors.isNotEmpty) ...[
            SectionHeader(
              title:
                  'Критические Ошибки (${state.analysis.criticalErrors.length})',
              icon: Icons.error_outline_rounded,
              iconColor: AppColors.error,
            ),
            ...state.analysis.criticalErrors.map((e) => _buildIssueCard(
                  context,
                  title: e.error,
                  subtitle: 'Статья: ${e.article}',
                  body: e.fix,
                  bodyLabel: 'Исправление',
                  color: AppColors.error,
                )),
            const SizedBox(height: DesignSystem.spacingXl),
          ],
          if (state.analysis.warnings.isNotEmpty) ...[
            SectionHeader(
              title: 'Предупреждения (${state.analysis.warnings.length})',
              icon: Icons.warning_amber_rounded,
              iconColor: AppColors.warning,
            ),
            ...state.analysis.warnings.map((w) => _buildIssueCard(
                  context,
                  title: w.risk,
                  subtitle: w.explanation,
                  body: w.suggestion,
                  bodyLabel: 'Рекомендация',
                  color: AppColors.warning,
                )),
            const SizedBox(height: DesignSystem.spacingXl),
          ],
          if (state.analysis.missingClauses.isNotEmpty) ...[
            SectionHeader(
              title:
                  'Недостающие пункты (${state.analysis.missingClauses.length})',
              icon: Icons.playlist_add_rounded,
              iconColor: AppColors.accentBlue,
            ),
            ...state.analysis.missingClauses.map((c) => _buildIssueCard(
                  context,
                  title: c.clauseName,
                  subtitle: 'Основание: ${c.articleReference}',
                  body: c.draftedText,
                  bodyLabel: 'Текст для добавления',
                  color: AppColors.accentBlue,
                )),
            const SizedBox(height: DesignSystem.spacingXl),
          ],
          if (state.analysis.summary.isNotEmpty) ...[
            const SectionHeader(
              title: 'Заключение',
              icon: Icons.summarize_rounded,
              iconColor: AppColors.accentTeal,
            ),
            GlassCard(
              child: MarkdownBody(
                data: state.analysis.summary,
                styleSheet: MarkdownStyler.getStyle(context),
              ),
            ),
          ],
          const SizedBox(height: DesignSystem.spacing4xl),
        ],
      ),
    );
  }

  Widget _buildScoreHeader(BuildContext context, ValidatorSuccess state) {
    final colors = context.colors;
    final score = state.analysis.validityScore;
    Color scoreColor;
    String verdict;

    if (score >= 80) {
      scoreColor = AppColors.success;
      verdict = 'ДОКУМЕНТ СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ';
    } else if (score >= 60) {
      scoreColor = AppColors.warning;
      verdict = 'ТРЕБУЮТСЯ НЕЗНАЧИТЕЛЬНЫЕ ИСПРАВЛЕНИЯ';
    } else if (score >= 40) {
      scoreColor = AppColors.accentOrange;
      verdict = 'ТРЕБУЮТСЯ ЗНАЧИТЕЛЬНЫЕ ДОРАБОТКИ';
    } else {
      scoreColor = AppColors.error;
      verdict = 'КРИТИЧЕСКИЕ НАРУШЕНИЯ';
    }

    return GlassCard(
      accentColor: scoreColor,
      padding: const EdgeInsets.all(DesignSystem.spacingXl),
      child: Row(
        children: [
          // Score circle
          SizedBox(
            width: 70,
            height: 70,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 70,
                  height: 70,
                  child: CircularProgressIndicator(
                    value: score / 100,
                    strokeWidth: 5,
                    strokeCap: StrokeCap.round,
                    backgroundColor: scoreColor.withValues(alpha: 0.12),
                    color: scoreColor,
                  ),
                ),
                Text(
                  '$score',
                  style: AppTextStyles.displayMedium
                      .copyWith(color: scoreColor, fontSize: 24),
                ),
              ],
            ),
          ),
          const SizedBox(width: DesignSystem.spacingBase),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  verdict,
                  style: AppTextStyles.heading3.copyWith(
                    color: scoreColor,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Общая оценка /100',
                  style: AppTextStyles.caption.copyWith(
                    color: colors.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIssueCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String body,
    required String bodyLabel,
    required Color color,
  }) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: GlassCard(
        accentColor: color,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: AppTextStyles.heading3
                    .copyWith(color: color, fontSize: 15)),
            const SizedBox(height: 4),
            Text(subtitle,
                style: AppTextStyles.bodySmall.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.7),
                )),
            Divider(color: colors.outlineVariant, height: 20),
            Text(bodyLabel,
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
                body,
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
}
