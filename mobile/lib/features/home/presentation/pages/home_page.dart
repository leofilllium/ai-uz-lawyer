import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/feature_icon.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../chat/presentation/pages/chat_page.dart';
import '../../../chat/presentation/bloc/chat_bloc.dart';
import '../../../chat/presentation/bloc/chat_state.dart';
import '../../../validator/presentation/pages/validator_page.dart';
import '../../../validator/presentation/pages/document_validator_page.dart';
import '../../../validator/presentation/bloc/validator_bloc.dart';
import '../../../validator/presentation/bloc/validator_state.dart';
import '../../../generator/presentation/bloc/generator_bloc.dart';
import '../../../generator/presentation/pages/generator_page.dart';
import '../../../organization/presentation/bloc/organization_bloc.dart';
import '../../../organization/presentation/bloc/organization_event.dart';
import '../../../organization/presentation/pages/team_management_page.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';
import 'main_navigation_page.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            DesignSystem.horizontalMarginMobile,
            DesignSystem.spacingBase,
            DesignSystem.horizontalMarginMobile,
            DesignSystem.bottomNavHeight + 32,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: DesignSystem.spacing2xl),
              _buildQuickActions(context),
              _buildTeamCard(context),
              const SizedBox(height: DesignSystem.spacing2xl),
              _buildRecentActivity(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final colors = context.colors;
    final customColors = context.customColors;

    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        String name = 'User';
        String initials = 'U';
        if (state is AuthAuthenticated) {
          name = state.user.name;
          final parts = name.split(' ');
          initials = parts.length > 1
              ? '${parts[0][0]}${parts[1][0]}'.toUpperCase()
              : name[0].toUpperCase();
        }

        return Row(
          children: [
            // Avatar
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: customColors.primaryGradient,
                borderRadius: BorderRadius.circular(DesignSystem.radiusMd),
              ),
              child: Center(
                child: Text(
                  initials,
                  style: AppTextStyles.buttonLarge.copyWith(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
            const SizedBox(width: DesignSystem.spacingMd),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    context.l10n.welcomeBack,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: colors.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                  Text(
                    name,
                    style: AppTextStyles.heading2.copyWith(
                      color: colors.onSurface,
                    ),
                  ),
                ],
              ),
            ),
            // Logout
            GlassCard(
              padding: const EdgeInsets.all(10),
              borderRadius: DesignSystem.radiusMd,
              onTap: () {
                context.read<AuthBloc>().add(LogoutRequested());
              },
              interactive: true,
              child: Icon(
                Icons.logout_rounded,
                size: 20,
                color: colors.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: context.l10n.quickActions,
          icon: Icons.bolt_rounded,
          iconColor: AppColors.accentOrange,
        ),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          crossAxisCount: 2,
          mainAxisSpacing: DesignSystem.spacingMd,
          crossAxisSpacing: DesignSystem.spacingMd,
          childAspectRatio: 1.15,
          children: [
            _ActionCard(
              title: context.l10n.home,
              subtitle: context.l10n.aiLawyerSubtitle,
              icon: Icons.chat_bubble_rounded,
              color: AppColors.primary,
              gradient: AppColors.chatGradient,
              onTap: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<ChatBloc>(),
                    child: const ChatPage(),
                  ),
                ));
              },
            ),
            _ActionCard(
              title: context.l10n.validator,
              subtitle: context.l10n.validatorSubtitle,
              icon: Icons.verified_rounded,
              color: AppColors.accentBlue,
              gradient: AppColors.validatorGradient,
              onTap: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<ValidatorBloc>(),
                    child: const ValidatorPage(),
                  ),
                ));
              },
            ),
            _ActionCard(
              title: context.l10n.generator,
              subtitle: context.l10n.generatorSubtitle,
              icon: Icons.auto_awesome_rounded,
              color: AppColors.accentOrange,
              gradient: AppColors.generatorGradient,
              onTap: () {
                final bloc = context.read<GeneratorBloc>();
                bloc.add(LoadCategories());
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: bloc,
                    child: const GeneratorPage(),
                  ),
                ));
              },
            ),
            _ActionCard(
              title: 'Документы',
              subtitle: 'Проверка документов',
              icon: Icons.document_scanner_rounded,
              color: AppColors.accentIndigo,
              onTap: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<ValidatorBloc>(),
                    child: const DocumentValidatorPage(),
                  ),
                ));
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTeamCard(BuildContext context) {
    final colors = context.colors;

    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated || state.user.role != 'HEAD') {
          return const SizedBox.shrink();
        }

        return Padding(
          padding: const EdgeInsets.only(top: DesignSystem.spacingMd),
          child: GlassCard(
            interactive: true,
            accentColor: AppColors.accentIndigo,
            onTap: () {
              context.read<OrganizationBloc>().add(LoadOrgUsersEvent());
              Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<OrganizationBloc>(),
                  child: BlocProvider.value(
                    value: context.read<AuthBloc>(),
                    child: const TeamManagementPage(),
                  ),
                ),
              ));
            },
            child: Row(
              children: [
                const FeatureIcon(
                  icon: Icons.groups_rounded,
                  color: AppColors.accentIndigo,
                  size: 42,
                  iconSize: 20,
                ),
                const SizedBox(width: DesignSystem.spacingMd),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Управление Командой',
                        style: AppTextStyles.heading3.copyWith(
                          color: colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Участники, роли, одобрение',
                        style: AppTextStyles.caption.copyWith(
                          color: colors.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: colors.onSurface.withValues(alpha: 0.5),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRecentActivity(BuildContext context) {
    final colors = context.colors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: context.l10n.recentActivity,
          icon: Icons.access_time_rounded,
          iconColor: AppColors.accentTeal,
          actionText: context.l10n.viewAll,
          onAction: () {
            // Navigate to History tab
            MainNavigationPage.of(context)?.setIndex(2);
          },
        ),
        GlassCard(
          child: Column(
            children: [
              // Generated Contracts
              BlocBuilder<GeneratorBloc, GeneratorState>(
                builder: (context, state) {
                  if (state.history.isNotEmpty) {
                    final item = state.history.first;
                    final title = item.templateNames.isNotEmpty
                        ? item.templateNames.first
                        : 'Contract';
                    return Column(
                      children: [
                        _ActivityItem(
                          title: '$title (${item.category})',
                          date: item.createdAt != null
                              ? DateFormat('MMM d, y').format(
                                  DateTime.parse(item.createdAt!).toLocal())
                              : 'Unknown Date',
                          type: context.l10n.generated,
                          status: context.l10n.completed,
                          statusColor: AppColors.success,
                          icon: Icons.auto_awesome_rounded,
                          iconColor: AppColors.accentOrange,
                        ),
                        Divider(
                          height: 1,
                          color: colors.outlineVariant,
                        ),
                      ],
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
              // Validations
              BlocBuilder<ValidatorBloc, ValidatorState>(
                builder: (context, state) {
                  if (state is ValidatorHistoryLoaded &&
                      state.history.isNotEmpty) {
                    final item = state.history.first;
                    return Column(
                      children: [
                        _ActivityItem(
                          title: 'Анализ Договора',
                          date: item.createdAt != null
                              ? DateFormat('MMM d, y').format(
                                  DateTime.parse(item.createdAt!).toLocal())
                              : 'Unknown Date',
                          type: context.l10n.validation,
                          status: 'Score: ${item.validityScore}/100',
                          statusColor: item.validityScore > 80
                              ? AppColors.success
                              : (item.validityScore > 50
                                  ? AppColors.warning
                                  : AppColors.error),
                          icon: Icons.verified_rounded,
                          iconColor: AppColors.accentBlue,
                        ),
                        Divider(
                          height: 1,
                          color: colors.outlineVariant,
                        ),
                      ],
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
              // Chats
              BlocBuilder<ChatBloc, ChatState>(
                builder: (context, state) {
                  if (state is ChatSessionsLoaded &&
                      state.sessions.isNotEmpty) {
                    final item = state.sessions.first;
                    return _ActivityItem(
                      title: item.title,
                      date: DateFormat('MMM d, y')
                          .format(DateTime.parse(item.updatedAt!).toLocal()),
                      type: context.l10n.chat,
                      status: '${item.messageCount} msgs',
                      statusColor: AppColors.textTertiary,
                      icon: Icons.chat_bubble_rounded,
                      iconColor: AppColors.primary,
                    );
                  }
                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: DesignSystem.spacingLg,
                    ),
                    child: Center(
                      child: Text(
                        context.l10n.noRecentActivity,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: colors.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final LinearGradient? gradient;
  final VoidCallback onTap;

  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return GlassCard(
      interactive: true,
      onTap: onTap,
      padding: const EdgeInsets.all(DesignSystem.spacingBase),
      accentColor: color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          FeatureIcon(
            icon: icon,
            color: color,
            gradient: gradient,
            size: 42,
            iconSize: 20,
          ),
          const Spacer(),
          Text(
            title,
            style: AppTextStyles.heading3.copyWith(
              color: colors.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: AppTextStyles.caption.copyWith(
              color: colors.onSurface.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final String title;
  final String date;
  final String type;
  final String status;
  final Color statusColor;
  final IconData icon;
  final Color iconColor;

  const _ActivityItem({
    required this.title,
    required this.date,
    required this.type,
    required this.status,
    required this.statusColor,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingMd),
      child: Row(
        children: [
          FeatureIcon(
            icon: icon,
            color: iconColor,
            size: 38,
            iconSize: 18,
          ),
          const SizedBox(width: DesignSystem.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: colors.onSurface,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '$type  \u2022  $date',
                  style: AppTextStyles.caption.copyWith(
                    color: colors.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          StatusBadge(text: status, color: statusColor),
        ],
      ),
    );
  }
}
