import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../bloc/tasks_bloc.dart';
import '../bloc/tasks_event.dart';
import '../bloc/tasks_state.dart';

class ProjectBoardPage extends StatefulWidget {
  const ProjectBoardPage({super.key});

  @override
  State<ProjectBoardPage> createState() => _ProjectBoardPageState();
}

class _ProjectBoardPageState extends State<ProjectBoardPage> {
  @override
  void initState() {
    super.initState();
    context.read<TasksBloc>().add(LoadTasksEvent());
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DONE':
        return AppColors.success;
      case 'IN_PROGRESS':
      case 'REVIEW':
        return AppColors.accentBlue;
      case 'TO_DO':
        return AppColors.accentOrange;
      case 'RE_DO':
        return AppColors.error;
      default:
        return AppColors.textTertiary;
    }
  }

  Color _priorityColor(String priority) {
    switch (priority.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return AppColors.error;
      case 'MEDIUM':
        return AppColors.warning;
      default:
        return AppColors.accentTeal;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Менеджер Задач'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GlassCard(
              padding: const EdgeInsets.all(8),
              borderRadius: DesignSystem.radiusSm,
              onTap: () {},
              interactive: true,
              child: Icon(
                Icons.add_rounded,
                size: 22,
                color: colors.primary,
              ),
            ),
          ),
        ],
      ),
      body: BlocConsumer<TasksBloc, TasksState>(
        listener: (context, state) {
          if (state is TasksError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          } else if (state is TaskOperationSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          if (state is TasksLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is TasksLoaded) {
            if (state.tasks.isEmpty) {
              return const EmptyState(
                icon: Icons.task_alt_rounded,
                title: 'Задачи не найдены',
                subtitle: 'Создайте первую задачу, чтобы начать',
              );
            }
            return ListView.builder(
              padding:
                  const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
              itemCount: state.tasks.length,
              itemBuilder: (context, index) {
                final task = state.tasks[index];
                return Padding(
                  padding:
                      const EdgeInsets.only(bottom: DesignSystem.spacingMd),
                  child: GlassCard(
                    interactive: true,
                    onTap: () {},
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          task.title,
                          style: AppTextStyles.heading3.copyWith(
                            fontSize: 15,
                            color: colors.onSurface,
                          ),
                        ),
                        const SizedBox(height: DesignSystem.spacingSm),
                        Row(
                          children: [
                            StatusBadge(
                              text: task.status.value,
                              color: _statusColor(task.status.value),
                            ),
                            const SizedBox(width: 8),
                            StatusBadge(
                              text: task.priority.value,
                              color: _priorityColor(task.priority.value),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          }
          return const EmptyState(
            icon: Icons.task_alt_rounded,
            title: 'Загрузка задач...',
          );
        },
      ),
    );
  }
}
