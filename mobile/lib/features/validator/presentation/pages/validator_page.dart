import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/feature_icon.dart';
import '../bloc/validator_bloc.dart';
import '../bloc/validator_event.dart';
import '../bloc/validator_state.dart';
import '../widgets/analysis_result_view.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

class ValidatorPage extends StatelessWidget {
  const ValidatorPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _ValidatorView();
  }
}

class _ValidatorView extends StatefulWidget {
  const _ValidatorView();

  @override
  State<_ValidatorView> createState() => _ValidatorViewState();
}

class _ValidatorViewState extends State<_ValidatorView> {
  final _contractController = TextEditingController();

  @override
  void dispose() {
    _contractController.dispose();
    super.dispose();
  }

  void _analyzeContract() {
    final text = _contractController.text.trim();
    if (text.length < 50) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.contractTooShort),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }
    context.read<ValidatorBloc>().add(ValidateContractRequested(text));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.contractValidator),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GlassCard(
              padding: const EdgeInsets.all(8),
              borderRadius: DesignSystem.radiusSm,
              onTap: () {},
              interactive: true,
              child: Icon(
                Icons.history_rounded,
                size: 20,
                color: colors.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ),
        ],
      ),
      body: BlocBuilder<ValidatorBloc, ValidatorState>(
        builder: (context, state) {
          if (state is ValidatorLoading) {
            return _buildLoadingState(context);
          }

          if (state is ValidatorSuccess) {
            return Column(
              children: [
                Expanded(child: AnalysisResultView(analysis: state.analysis)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    DesignSystem.horizontalMarginMobile,
                    DesignSystem.spacingSm,
                    DesignSystem.horizontalMarginMobile,
                    DesignSystem.spacingBase,
                  ),
                  child: PrimaryButton(
                    text: context.l10n.analyzeAnother,
                    icon: Icons.refresh_rounded,
                    onPressed: () {
                      _contractController.clear();
                      context.read<ValidatorBloc>().add(ResetValidator());
                    },
                  ),
                ),
              ],
            );
          }

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
                // Header card
                GlassCard(
                  accentColor: AppColors.accentBlue,
                  child: Row(
                    children: [
                      const FeatureIcon(
                        icon: Icons.verified_rounded,
                        color: AppColors.accentBlue,
                        gradient: AppColors.validatorGradient,
                        size: 48,
                        iconSize: 24,
                      ),
                      const SizedBox(width: DesignSystem.spacingMd),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.checkYourContract,
                              style: AppTextStyles.heading3.copyWith(
                                color: colors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              context.l10n.pasteContractInstruction,
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
                // Contract input
                Container(
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerHighest,
                    borderRadius:
                        BorderRadius.circular(DesignSystem.cardRadius),
                    border: Border.all(
                      color: colors.outline,
                    ),
                  ),
                  child: TextField(
                    controller: _contractController,
                    maxLines: 15,
                    minLines: 8,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: colors.onSurface,
                    ),
                    decoration: InputDecoration(
                      hintText: context.l10n.pasteContractHint,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding:
                          const EdgeInsets.all(DesignSystem.spacingBase),
                    ),
                  ),
                ),
                const SizedBox(height: DesignSystem.spacingXl),
                if (state is ValidatorError)
                  Padding(
                    padding:
                        const EdgeInsets.only(bottom: DesignSystem.spacingMd),
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
                  text: context.l10n.analyzeContractButton,
                  icon: Icons.search_rounded,
                  onPressed: _analyzeContract,
                ),
              ],
            ),
          );
        },
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
            context.l10n.analyzingContract,
            style: AppTextStyles.heading3.copyWith(
              color: colors.onSurface,
            ),
          ),
          const SizedBox(height: DesignSystem.spacingSm),
          Text(
            context.l10n.takeAMinute,
            style: AppTextStyles.bodySmall.copyWith(
              color: colors.onSurface.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}
