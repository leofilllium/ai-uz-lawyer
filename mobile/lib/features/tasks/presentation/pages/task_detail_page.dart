import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/feature_icon.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../domain/entities/task_enums.dart';
import '../bloc/tasks_bloc.dart';
import '../bloc/tasks_event.dart';
import '../bloc/tasks_state.dart';

const _statusLabels = <String, String>{
  'BACKLOG': 'Backlog',
  'TO_DO': 'To Do',
  'IN_PROGRESS': 'В работе',
  'REVIEW': 'На проверке',
  'DONE': 'Завершено',
  'RE_DO': 'На доработке',
};

const _priorityLabels = <String, String>{
  'LOW': 'Низкий',
  'MEDIUM': 'Средний',
  'HIGH': 'Высокий',
  'URGENT': 'Срочный',
};

const _complexityLabels = <String, String>{
  'EASY': 'Лёгкая',
  'MEDIUM': 'Средняя',
  'HARD': 'Сложная',
};

Color _statusColor(String val) {
  switch (val) {
    case 'DONE':
      return AppColors.success;
    case 'IN_PROGRESS':
      return AppColors.accentOrange;
    case 'REVIEW':
      return AppColors.accentBlue;
    case 'RE_DO':
      return AppColors.error;
    default:
      return AppColors.accentTeal;
  }
}

Color _priorityColor(String val) {
  switch (val) {
    case 'URGENT':
      return AppColors.error;
    case 'HIGH':
      return AppColors.accentOrange;
    case 'MEDIUM':
      return AppColors.warning;
    default:
      return AppColors.accentTeal;
  }
}

class TaskDetailPage extends StatefulWidget {
  final int taskId;

  const TaskDetailPage({super.key, required this.taskId});

  @override
  State<TaskDetailPage> createState() => _TaskDetailPageState();
}

class _TaskDetailPageState extends State<TaskDetailPage> {
  final _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<TasksBloc>().add(LoadTaskDetailEvent(widget.taskId));
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _updateStatus(TaskStatus newStatus) {
    context
        .read<TasksBloc>()
        .add(UpdateTaskEvent(widget.taskId, {'status': newStatus.value}));
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final customColors = context.customColors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Детали Задачи'),
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
            // Reload detail after operation
            context.read<TasksBloc>().add(LoadTaskDetailEvent(widget.taskId));
          }
        },
        builder: (context, state) {
          if (state is TasksLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is TaskDetailLoaded) {
            final task = state.taskDetail;
            return Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(
                        DesignSystem.horizontalMarginMobile),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title + Status
                        Text(
                          task.title,
                          style: AppTextStyles.heading1.copyWith(
                            color: colors.onSurface,
                          ),
                        ),
                        const SizedBox(height: DesignSystem.spacingMd),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            StatusBadge(
                              text: _statusLabels[task.status.value] ??
                                  task.status.value,
                              color: _statusColor(task.status.value),
                            ),
                            StatusBadge(
                              text: _priorityLabels[task.priority.value] ??
                                  task.priority.value,
                              color: _priorityColor(task.priority.value),
                            ),
                            StatusBadge(
                              text: _complexityLabels[task.complexity.value] ??
                                  task.complexity.value,
                              color: AppColors.accentIndigo,
                            ),
                          ],
                        ),
                        const SizedBox(height: DesignSystem.spacingXl),

                        // Metadata card
                        GlassCard(
                          child: Column(
                            children: [
                              _metaRow(Icons.person_rounded, 'Исполнитель',
                                  task.assigneeName ?? 'Не назначен', colors),
                              Divider(color: colors.outlineVariant, height: 20),
                              _metaRow(Icons.person_outline_rounded, 'Автор',
                                  task.reporterName ?? '—', colors),
                              if (task.deadline != null) ...[
                                Divider(
                                    color: colors.outlineVariant, height: 20),
                                _metaRow(
                                  Icons.calendar_today_rounded,
                                  'Дедлайн',
                                  DateFormat('d MMMM yyyy, HH:mm', 'ru').format(
                                      DateTime.parse(task.deadline!).toLocal()),
                                  colors,
                                ),
                              ],
                              Divider(color: colors.outlineVariant, height: 20),
                              _metaRow(
                                Icons.access_time_rounded,
                                'Создано',
                                DateFormat('d MMM yyyy', 'ru').format(
                                    DateTime.parse(task.createdAt).toLocal()),
                                colors,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: DesignSystem.spacingXl),

                        // Status actions
                        _buildStatusActions(task.status),
                        if (task.status != TaskStatus.done)
                          const SizedBox(height: DesignSystem.spacingXl),

                        // Description
                        if (task.description != null) ...[
                          const SectionHeader(
                            title: 'Описание',
                            icon: Icons.notes_rounded,
                            iconColor: AppColors.accentTeal,
                          ),
                          GlassCard(
                            child: Text(
                              task.description!,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: colors.onSurface,
                                height: 1.6,
                              ),
                            ),
                          ),
                          const SizedBox(height: DesignSystem.spacingXl),
                        ],

                        // Attachments
                        if (task.attachments.isNotEmpty) ...[
                          SectionHeader(
                            title: 'Файлы (${task.attachments.length})',
                            icon: Icons.attach_file_rounded,
                            iconColor: AppColors.accentOrange,
                          ),
                          ...task.attachments.map((a) => Padding(
                                padding: const EdgeInsets.only(
                                    bottom: DesignSystem.spacingSm),
                                child: GlassCard(
                                  padding: const EdgeInsets.all(
                                      DesignSystem.spacingMd),
                                  child: Row(
                                    children: [
                                      const FeatureIcon(
                                        icon: Icons.insert_drive_file_rounded,
                                        color: AppColors.accentBlue,
                                        size: 36,
                                        iconSize: 16,
                                      ),
                                      const SizedBox(
                                          width: DesignSystem.spacingMd),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              a.filename,
                                              style: AppTextStyles.bodyMedium
                                                  .copyWith(
                                                fontWeight: FontWeight.w600,
                                                color: colors.onSurface,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            Text(
                                              _formatBytes(a.fileSize),
                                              style: AppTextStyles.caption
                                                  .copyWith(
                                                color: colors.onSurface
                                                    .withValues(alpha: 0.5),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )),
                          const SizedBox(height: DesignSystem.spacingXl),
                        ],

                        // Comments
                        SectionHeader(
                          title: 'Комментарии (${task.comments.length})',
                          icon: Icons.forum_rounded,
                          iconColor: AppColors.accentOrange,
                        ),
                        if (task.comments.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                                vertical: DesignSystem.spacingBase),
                            child: Center(
                              child: Text(
                                'Пока нет комментариев',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color:
                                      colors.onSurface.withValues(alpha: 0.5),
                                ),
                              ),
                            ),
                          )
                        else
                          ...task.comments.map((comment) {
                            return Padding(
                              padding: const EdgeInsets.only(
                                  bottom: DesignSystem.spacingSm),
                              child: GlassCard(
                                padding: const EdgeInsets.all(
                                    DesignSystem.spacingMd),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 28,
                                          height: 28,
                                          decoration: BoxDecoration(
                                            gradient:
                                                customColors.primaryGradient,
                                            borderRadius:
                                                BorderRadius.circular(14),
                                          ),
                                          child: Center(
                                            child: Text(
                                              comment.userName.isNotEmpty
                                                  ? comment.userName[0]
                                                      .toUpperCase()
                                                  : '?',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          comment.userName,
                                          style: AppTextStyles.label.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: colors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      comment.content,
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: colors.onSurface,
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
                ),
                // Comment input
                Container(
                  padding: const EdgeInsets.fromLTRB(
                    DesignSystem.horizontalMarginMobile,
                    DesignSystem.spacingSm,
                    DesignSystem.horizontalMarginMobile,
                    DesignSystem.spacingBase,
                  ),
                  decoration: BoxDecoration(
                    color: colors.surface.withValues(alpha: 0.95),
                    border: Border(
                      top: BorderSide(color: colors.outlineVariant),
                    ),
                  ),
                  child: SafeArea(
                    top: false,
                    child: Row(
                      children: [
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: colors.surfaceContainerHighest,
                              borderRadius:
                                  BorderRadius.circular(DesignSystem.radius2xl),
                            ),
                            child: TextField(
                              controller: _commentController,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: colors.onSurface,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Добавьте комментарий...',
                                hintStyle: AppTextStyles.bodyMedium.copyWith(
                                  color:
                                      colors.onSurface.withValues(alpha: 0.5),
                                ),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            gradient: customColors.primaryGradient,
                            borderRadius:
                                BorderRadius.circular(DesignSystem.radiusFull),
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(
                                  DesignSystem.radiusFull),
                              onTap: () {
                                if (_commentController.text.isNotEmpty) {
                                  context.read<TasksBloc>().add(
                                        AddTaskCommentEvent(
                                          widget.taskId,
                                          _commentController.text,
                                        ),
                                      );
                                  _commentController.clear();
                                }
                              },
                              child: const Icon(
                                Icons.send_rounded,
                                size: 18,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }
          return const Center(child: Text('Загрузка деталей задачи...'));
        },
      ),
    );
  }

  Widget _metaRow(
      IconData icon, String label, String value, ColorScheme colors) {
    return Row(
      children: [
        Icon(icon, size: 18, color: colors.onSurface.withValues(alpha: 0.5)),
        const SizedBox(width: DesignSystem.spacingMd),
        Text(
          label,
          style: AppTextStyles.caption.copyWith(
            color: colors.onSurface.withValues(alpha: 0.5),
          ),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w500,
              color: colors.onSurface,
            ),
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusActions(TaskStatus current) {
    final List<Widget> buttons = [];

    // TO_DO / RE_DO → IN_PROGRESS
    if (current == TaskStatus.toDo || current == TaskStatus.reDo) {
      buttons.add(PrimaryButton(
        text: '🚀 Взять в работу',
        icon: Icons.play_arrow_rounded,
        onPressed: () => _updateStatus(TaskStatus.inProgress),
      ));
    }

    // IN_PROGRESS → REVIEW
    if (current == TaskStatus.inProgress) {
      buttons.add(PrimaryButton(
        text: '📤 На проверку',
        icon: Icons.rate_review_rounded,
        onPressed: () => _updateStatus(TaskStatus.review),
      ));
    }

    // REVIEW → DONE or RE_DO
    if (current == TaskStatus.review) {
      buttons.add(PrimaryButton(
        text: '✅ Завершить',
        icon: Icons.check_circle_rounded,
        onPressed: () => _updateStatus(TaskStatus.done),
      ));
      buttons.add(const SizedBox(height: 8));
      buttons.add(
        OutlinedButton.icon(
          onPressed: () => _updateStatus(TaskStatus.reDo),
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('На доработку'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 48),
          ),
        ),
      );
    }

    if (buttons.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: buttons,
    );
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
