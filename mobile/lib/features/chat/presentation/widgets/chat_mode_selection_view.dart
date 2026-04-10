import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../domain/entities/chat_modes.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

class ChatModeSelectionView extends StatelessWidget {
  final Function(ChatMode) onModeSelected;

  const ChatModeSelectionView({
    super.key,
    required this.onModeSelected,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            DesignSystem.horizontalMarginMobile,
            DesignSystem.spacingBase,
            DesignSystem.horizontalMarginMobile,
            DesignSystem.spacingSm,
          ),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.l10n.chooseSpecialist,
                  style: AppTextStyles.heading2.copyWith(
                    color: colors.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  context.l10n.chooseExpertForConsultation,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: colors.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            DesignSystem.horizontalMarginMobile,
            DesignSystem.spacingSm,
            DesignSystem.horizontalMarginMobile,
            DesignSystem.bottomNavHeight + 32,
          ),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: DesignSystem.spacingSm,
              mainAxisSpacing: DesignSystem.spacingSm,
              childAspectRatio: 0.85,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final mode = ChatMode.modes[index];
                return _PersonaCard(
                  mode: mode,
                  onTap: () => onModeSelected(mode),
                );
              },
              childCount: ChatMode.modes.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _PersonaCard extends StatelessWidget {
  final ChatMode mode;
  final VoidCallback onTap;

  const _PersonaCard({
    required this.mode,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return GlassCard(
      interactive: true,
      onTap: onTap,
      padding: const EdgeInsets.symmetric(
        horizontal: DesignSystem.spacingSm,
        vertical: DesignSystem.spacingMd,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: (colors.primary).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(DesignSystem.radiusMd),
            ),
            child: Center(
              child: Text(
                mode.icon,
                style: const TextStyle(fontSize: 22),
              ),
            ),
          ),
          const SizedBox(height: DesignSystem.spacingSm),
          Text(
            context.tr(mode.labelKey),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.labelSmall.copyWith(
              color: colors.onSurface,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
