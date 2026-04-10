import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import '../bloc/generator_bloc.dart';

class GeneratorPage extends StatefulWidget {
  const GeneratorPage({super.key});

  @override
  State<GeneratorPage> createState() => _GeneratorPageState();
}

class _GeneratorPageState extends State<GeneratorPage> {
  final _requirementsController = TextEditingController();
  String? _selectedCategory;

  @override
  void dispose() {
    _requirementsController.dispose();
    super.dispose();
  }

  void _generate() {
    if (_selectedCategory == null) return;
    final text = _requirementsController.text.trim();
    if (text.length < 20) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Опишите требования подробнее (минимум 20 символов)'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }
    context.read<GeneratorBloc>().add(GenerateContractRequested(
          category: _selectedCategory!,
          requirements: text,
        ));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Генератор Договоров'),
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
      body: BlocBuilder<GeneratorBloc, GeneratorState>(
        builder: (context, state) {
          // Show generated result
          if (state.status == GeneratorStatus.success &&
              (state.generatedContent.isNotEmpty ||
                  state.fullContract != null)) {
            return _buildResult(context, state);
          }

          // Show generating state
          if (state.status == GeneratorStatus.generating) {
            return _buildGenerating(context, state);
          }

          // Show form
          return _buildForm(context, state);
        },
      ),
    );
  }

  Widget _buildForm(BuildContext context, GeneratorState state) {
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
            accentColor: AppColors.accentOrange,
            child: Row(
              children: [
                const FeatureIcon(
                  icon: Icons.auto_awesome_rounded,
                  color: AppColors.accentOrange,
                  gradient: AppColors.generatorGradient,
                  size: 48,
                  iconSize: 24,
                ),
                const SizedBox(width: DesignSystem.spacingMd),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Создайте договор',
                        style: AppTextStyles.heading3.copyWith(
                          color: colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Выберите категорию и опишите требования',
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

          // Category dropdown
          Text('Категория договора',
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
            child: state.categories.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(DesignSystem.spacingBase),
                    child: Center(child: CircularProgressIndicator()),
                  )
                : DropdownButtonFormField<String>(
                    initialValue: _selectedCategory,
                    decoration: const InputDecoration(
                      hintText: 'Выберите категорию...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: DesignSystem.spacingBase),
                    ),
                    items: state.categories.map((cat) {
                      return DropdownMenuItem(
                        value: cat.name,
                        child: Text(cat.name),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedCategory = val),
                    dropdownColor: colors.surfaceContainerHighest,
                    isExpanded: true,
                  ),
          ),
          const SizedBox(height: DesignSystem.spacingXl),

          // Requirements input
          Text('Требования к договору',
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
              controller: _requirementsController,
              maxLines: 8,
              minLines: 5,
              style: AppTextStyles.bodyMedium.copyWith(
                color: colors.onSurface,
              ),
              decoration: const InputDecoration(
                hintText:
                    'Опишите стороны, предмет договора, условия, сроки, суммы...',
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.all(DesignSystem.spacingBase),
              ),
            ),
          ),
          const SizedBox(height: DesignSystem.spacingXl),

          if (state.status == GeneratorStatus.error &&
              state.errorMessage != null)
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
                        state.errorMessage!,
                        style: AppTextStyles.bodySmall
                            .copyWith(color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          PrimaryButton(
            text: 'Сгенерировать договор',
            icon: Icons.auto_awesome_rounded,
            onPressed: _generate,
          ),
        ],
      ),
    );
  }

  Widget _buildGenerating(BuildContext context, GeneratorState state) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
      child: Column(
        children: [
          // Status header
          GlassCard(
            accentColor: AppColors.primary,
            child: Row(
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: colors.primary,
                  ),
                ),
                const SizedBox(width: DesignSystem.spacingMd),
                Text(
                  'ИИ-Юрист генерирует договор...',
                  style: AppTextStyles.heading3.copyWith(
                    color: colors.primary,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: DesignSystem.spacingBase),
          // Streaming content
          Expanded(
            child: SingleChildScrollView(
              child: GlassCard(
                child: MarkdownBody(
                  data: state.generatedContent,
                  styleSheet: MarkdownStyler.getStyle(context),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult(BuildContext context, GeneratorState state) {
    final colors = context.colors;
    final content = state.fullContract ?? state.generatedContent;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Result header
                GlassCard(
                  accentColor: AppColors.success,
                  child: Row(
                    children: [
                      const FeatureIcon(
                        icon: Icons.check_circle_rounded,
                        color: AppColors.success,
                        size: 42,
                        iconSize: 20,
                      ),
                      const SizedBox(width: DesignSystem.spacingMd),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Договор сгенерирован',
                              style: AppTextStyles.heading3.copyWith(
                                color: colors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _selectedCategory ?? '',
                              style: AppTextStyles.caption.copyWith(
                                color: colors.onSurface.withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Copy button
                      GlassCard(
                        padding: const EdgeInsets.all(8),
                        borderRadius: DesignSystem.radiusSm,
                        interactive: true,
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: content));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Скопировано в буфер обмена')),
                          );
                        },
                        child: Icon(
                          Icons.copy_rounded,
                          size: 20,
                          color: colors.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: DesignSystem.spacingBase),
                // Contract content
                GlassCard(
                  child: MarkdownBody(
                    data: content,
                    styleSheet: MarkdownStyler.getStyle(context),
                  ),
                ),
              ],
            ),
          ),
        ),
        // Bottom action
        Padding(
          padding: const EdgeInsets.fromLTRB(
            DesignSystem.horizontalMarginMobile,
            DesignSystem.spacingSm,
            DesignSystem.horizontalMarginMobile,
            DesignSystem.spacingBase,
          ),
          child: PrimaryButton(
            text: 'Создать ещё',
            icon: Icons.refresh_rounded,
            onPressed: () {
              _requirementsController.clear();
              setState(() => _selectedCategory = null);
              context.read<GeneratorBloc>().add(ResetGenerator());
            },
          ),
        ),
      ],
    );
  }
}
