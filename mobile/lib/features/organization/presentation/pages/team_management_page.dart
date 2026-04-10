import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../bloc/organization_bloc.dart';
import '../bloc/organization_event.dart';
import '../bloc/organization_state.dart';

class TeamManagementPage extends StatefulWidget {
  const TeamManagementPage({super.key});

  @override
  State<TeamManagementPage> createState() => _TeamManagementPageState();
}

class _TeamManagementPageState extends State<TeamManagementPage> {
  @override
  void initState() {
    super.initState();
    context.read<OrganizationBloc>().add(LoadOrgUsersEvent());
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final customColors = context.customColors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Управление Командой'),
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
      body: BlocConsumer<OrganizationBloc, OrganizationState>(
        listener: (context, state) {
          if (state is OrganizationError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          } else if (state is OrganizationOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          final authState = context.read<AuthBloc>().state;
          bool isHead = false;
          int? currentUserId;
          if (authState is AuthAuthenticated) {
            isHead = authState.user.role == 'HEAD';
            currentUserId = authState.user.id;
          }

          if (!isHead) {
            return const EmptyState(
              icon: Icons.lock_outline_rounded,
              title: 'В доступе отказано',
              subtitle: 'Только Руководитель может управлять командой.',
            );
          }

          if (state is OrganizationLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is OrgUsersLoaded) {
            final users = state.users;
            if (users.isEmpty) {
              return const EmptyState(
                icon: Icons.groups_outlined,
                title: 'Нет пользователей в организации',
              );
            }
            return ListView.builder(
              padding:
                  const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
              itemCount: users.length,
              itemBuilder: (context, index) {
                final user = users[index];
                final isApproved = user.isApproved ?? false;
                final isCurrentUser = user.id == currentUserId;

                return Padding(
                  padding:
                      const EdgeInsets.only(bottom: DesignSystem.spacingMd),
                  child: GlassCard(
                    child: Row(
                      children: [
                        // Avatar
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            gradient: isCurrentUser
                                ? (customColors.primaryGradient)
                                : null,
                            color: isCurrentUser
                                ? null
                                : (colors.surfaceContainerHighest),
                            borderRadius:
                                BorderRadius.circular(DesignSystem.radiusMd),
                          ),
                          child: Center(
                            child: Text(
                              user.name.isNotEmpty
                                  ? user.name[0].toUpperCase()
                                  : '?',
                              style: AppTextStyles.buttonLarge.copyWith(
                                color: isCurrentUser
                                    ? Colors.white
                                    : (colors.onSurface),
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
                              Row(
                                children: [
                                  Text(
                                    user.name,
                                    style: AppTextStyles.heading3.copyWith(
                                      fontSize: 15,
                                      color: colors.onSurface,
                                    ),
                                  ),
                                  if (isCurrentUser) ...[
                                    const SizedBox(width: 6),
                                    const StatusBadge(
                                      text: 'Вы',
                                      color: AppColors.primary,
                                      filled: true,
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                user.email,
                                style: AppTextStyles.caption.copyWith(
                                  color:
                                      colors.onSurface.withValues(alpha: 0.5),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Actions
                        if (!isApproved)
                          SizedBox(
                            height: 36,
                            child: ElevatedButton(
                              onPressed: () {
                                context
                                    .read<OrganizationBloc>()
                                    .add(ApproveUserEvent(user.id));
                              },
                              style: ElevatedButton.styleFrom(
                                minimumSize: Size.zero,
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 16),
                                textStyle: AppTextStyles.buttonMedium,
                              ),
                              child: const Text('Одобрить'),
                            ),
                          )
                        else if (!isCurrentUser && user.role != 'HEAD')
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: colors.surfaceContainerHighest,
                              borderRadius:
                                  BorderRadius.circular(DesignSystem.radiusSm),
                            ),
                            child: DropdownButton<String>(
                              value: ['SENIOR', 'EMPLOYEE']
                                      .contains(user.role?.toUpperCase())
                                  ? user.role!.toUpperCase()
                                  : 'EMPLOYEE',
                              items: const [
                                DropdownMenuItem(
                                    value: 'SENIOR',
                                    child: Text('Старший специалист')),
                                DropdownMenuItem(
                                    value: 'EMPLOYEE',
                                    child: Text('Сотрудник')),
                              ],
                              onChanged: (newRole) {
                                if (newRole != null &&
                                    newRole != user.role?.toUpperCase()) {
                                  context.read<OrganizationBloc>().add(
                                      UpdateUserRoleEvent(user.id, newRole));
                                }
                              },
                              underline: const SizedBox.shrink(),
                              isDense: true,
                              style: AppTextStyles.label.copyWith(
                                color: colors.onSurface,
                              ),
                              dropdownColor: colors.surfaceContainerHighest,
                            ),
                          )
                        else
                          StatusBadge(
                            text: user.role ?? 'Unknown',
                            color: AppColors.accentIndigo,
                          ),
                      ],
                    ),
                  ),
                );
              },
            );
          }
          return const Center(child: Text('Загрузка участников команды...'));
        },
      ),
    );
  }
}
