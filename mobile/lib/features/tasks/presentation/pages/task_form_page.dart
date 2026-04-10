import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../auth/domain/entities/user.dart';
import '../../../organization/domain/repositories/organization_repository.dart';
import '../../../../core/di/injection_container.dart';
import '../../domain/entities/task_enums.dart';
import '../bloc/tasks_bloc.dart';
import '../bloc/tasks_event.dart';

class TaskFormPage extends StatefulWidget {
  final int? editingTaskId;

  const TaskFormPage({super.key, this.editingTaskId});

  @override
  State<TaskFormPage> createState() => _TaskFormPageState();
}

class _TaskFormPageState extends State<TaskFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  TaskStatus _status = TaskStatus.toDo;
  TaskPriority _priority = TaskPriority.medium;
  TaskComplexity _complexity = TaskComplexity.medium;
  int? _assigneeId;
  DateTime? _deadline;

  List<User> _orgUsers = [];
  bool _loadingUsers = true;

  @override
  void initState() {
    super.initState();
    _loadOrgUsers();
  }

  Future<void> _loadOrgUsers() async {
    try {
      final repo = sl<OrganizationRepository>();
      final users = await repo.getOrgUsers();
      if (mounted) {
        setState(() {
          _orgUsers = users.where((u) => u.isApproved == true).toList();
          _loadingUsers = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingUsers = false);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final taskData = <String, dynamic>{
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : null,
        'status': _status.value,
        'priority': _priority.value,
        'complexity': _complexity.value,
        if (_assigneeId != null) 'assignee_id': _assigneeId,
        if (_deadline != null) 'deadline': _deadline!.toIso8601String(),
      };

      if (widget.editingTaskId == null) {
        context.read<TasksBloc>().add(CreateTaskEvent(taskData));
      } else {
        context
            .read<TasksBloc>()
            .add(UpdateTaskEvent(widget.editingTaskId!, taskData));
      }
      Navigator.pop(context);
    }
  }

  Future<void> _pickDeadline() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _deadline ?? now.add(const Duration(days: 7)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (date != null && mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_deadline ?? now),
      );
      if (time != null && mounted) {
        setState(() {
          _deadline =
              DateTime(date.year, date.month, date.day, time.hour, time.minute);
        });
      } else {
        setState(() {
          _deadline = DateTime(date.year, date.month, date.day, 18, 0);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isEditing = widget.editingTaskId != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Редактирование' : 'Новая Задача'),
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SectionHeader(
                title: 'Детали Задачи',
                icon: Icons.edit_note_rounded,
                iconColor: AppColors.accentIndigo,
              ),
              GlassCard(
                padding: const EdgeInsets.all(DesignSystem.spacingXl),
                child: Column(
                  children: [
                    CustomTextField(
                      label: 'Заголовок *',
                      hint: 'Введите название задачи...',
                      controller: _titleController,
                      validator: (value) => value == null || value.isEmpty
                          ? 'Введите заголовок'
                          : null,
                    ),
                    const SizedBox(height: DesignSystem.spacingBase),
                    CustomTextField(
                      label: 'Описание',
                      hint: 'Подробное описание задачи... (Markdown)',
                      controller: _descriptionController,
                      maxLines: 6,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: DesignSystem.spacingXl),
              const SectionHeader(
                title: 'Настройки',
                icon: Icons.tune_rounded,
                iconColor: AppColors.accentTeal,
              ),
              GlassCard(
                padding: const EdgeInsets.all(DesignSystem.spacingXl),
                child: Column(
                  children: [
                    _buildEnumDropdown<TaskPriority>(
                      label: 'Приоритет',
                      value: _priority,
                      items: TaskPriority.values,
                      labelMap: const {
                        'LOW': 'Низкий',
                        'MEDIUM': 'Средний',
                        'HIGH': 'Высокий',
                        'URGENT': 'Срочный',
                      },
                      onChanged: (v) => setState(() => _priority = v!),
                    ),
                    const SizedBox(height: DesignSystem.spacingBase),
                    _buildEnumDropdown<TaskComplexity>(
                      label: 'Сложность',
                      value: _complexity,
                      items: TaskComplexity.values,
                      labelMap: const {
                        'EASY': 'Лёгкая',
                        'MEDIUM': 'Средняя',
                        'HARD': 'Сложная',
                      },
                      onChanged: (v) => setState(() => _complexity = v!),
                    ),
                    if (isEditing) ...[
                      const SizedBox(height: DesignSystem.spacingBase),
                      _buildEnumDropdown<TaskStatus>(
                        label: 'Статус',
                        value: _status,
                        items: TaskStatus.values,
                        labelMap: const {
                          'BACKLOG': 'Backlog',
                          'TO_DO': 'To Do',
                          'IN_PROGRESS': 'В работе',
                          'REVIEW': 'На проверке',
                          'DONE': 'Завершено',
                          'RE_DO': 'На доработке',
                        },
                        onChanged: (v) => setState(() => _status = v!),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: DesignSystem.spacingXl),
              const SectionHeader(
                title: 'Назначение',
                icon: Icons.person_add_rounded,
                iconColor: AppColors.accentBlue,
              ),
              GlassCard(
                padding: const EdgeInsets.all(DesignSystem.spacingXl),
                child: Column(
                  children: [
                    // Assignee
                    _buildAssigneeDropdown(colors),
                    const SizedBox(height: DesignSystem.spacingBase),
                    // Deadline
                    _buildDeadlinePicker(colors),
                  ],
                ),
              ),
              const SizedBox(height: DesignSystem.spacing2xl),
              PrimaryButton(
                text: isEditing ? 'Сохранить' : 'Создать задачу',
                icon: isEditing ? Icons.save_rounded : Icons.add_rounded,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAssigneeDropdown(ColorScheme colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Исполнитель',
          style: AppTextStyles.label.copyWith(
            color: colors.onSurface.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: colors.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(DesignSystem.cardRadius),
            border: Border.all(color: colors.outline),
          ),
          child: _loadingUsers
              ? const Padding(
                  padding: EdgeInsets.all(DesignSystem.spacingBase),
                  child: Center(
                      child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )),
                )
              : DropdownButtonFormField<int?>(
                  value: _assigneeId,
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                        horizontal: DesignSystem.spacingBase),
                  ),
                  hint: const Text('Не назначен'),
                  items: [
                    const DropdownMenuItem<int?>(
                      value: null,
                      child: Text('Не назначен'),
                    ),
                    ..._orgUsers.map((u) => DropdownMenuItem<int?>(
                          value: u.id,
                          child: Text('${u.name} (${u.role ?? "—"})'),
                        )),
                  ],
                  onChanged: (val) => setState(() => _assigneeId = val),
                  dropdownColor: colors.surfaceContainerHighest,
                  isExpanded: true,
                ),
        ),
      ],
    );
  }

  Widget _buildDeadlinePicker(ColorScheme colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Дедлайн',
          style: AppTextStyles.label.copyWith(
            color: colors.onSurface.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        GlassCard(
          interactive: true,
          onTap: _pickDeadline,
          padding: const EdgeInsets.symmetric(
            horizontal: DesignSystem.spacingBase,
            vertical: DesignSystem.spacingMd,
          ),
          child: Row(
            children: [
              Icon(
                Icons.calendar_today_rounded,
                size: 18,
                color: _deadline != null
                    ? colors.primary
                    : colors.onSurface.withValues(alpha: 0.5),
              ),
              const SizedBox(width: DesignSystem.spacingMd),
              Expanded(
                child: Text(
                  _deadline != null
                      ? '${_deadline!.day}.${_deadline!.month.toString().padLeft(2, '0')}.${_deadline!.year}  ${_deadline!.hour}:${_deadline!.minute.toString().padLeft(2, '0')}'
                      : 'Не установлен',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: _deadline != null
                        ? colors.onSurface
                        : colors.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ),
              if (_deadline != null)
                GestureDetector(
                  onTap: () => setState(() => _deadline = null),
                  child: Icon(
                    Icons.close_rounded,
                    size: 18,
                    color: colors.onSurface.withValues(alpha: 0.5),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEnumDropdown<T>({
    required String label,
    required T value,
    required List<T> items,
    required Map<String, String> labelMap,
    required ValueChanged<T?> onChanged,
  }) {
    final colors = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.label.copyWith(
            color: colors.onSurface.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: colors.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(DesignSystem.cardRadius),
            border: Border.all(color: colors.outline),
          ),
          child: DropdownButtonFormField<T>(
            value: value,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding:
                  EdgeInsets.symmetric(horizontal: DesignSystem.spacingBase),
            ),
            items: items
                .map((s) => DropdownMenuItem(
                      value: s,
                      child: Text(labelMap[(s as dynamic).value as String] ??
                          (s as dynamic).value as String),
                    ))
                .toList(),
            onChanged: onChanged,
            dropdownColor: colors.surfaceContainerHighest,
            isExpanded: true,
          ),
        ),
      ],
    );
  }
}
