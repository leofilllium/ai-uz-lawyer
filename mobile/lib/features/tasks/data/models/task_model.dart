import '../../domain/entities/task.dart';
import '../../domain/entities/task_enums.dart';

class TaskModel extends Task {
  const TaskModel({
    required super.id,
    required super.title,
    super.description,
    required super.status,
    required super.priority,
    required super.complexity,
    super.deadline,
    required super.organizationId,
    super.assigneeId,
    required super.reporterId,
    super.reporterName,
    super.assigneeName,
    required super.createdAt,
    required super.updatedAt,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      status: TaskStatus.fromValue(json['status']),
      priority: TaskPriority.fromValue(json['priority']),
      complexity: TaskComplexity.fromValue(json['complexity']),
      deadline: json['deadline'],
      organizationId: json['organization_id'],
      assigneeId: json['assignee_id'],
      reporterId: json['reporter_id'],
      reporterName: json['reporter_name'],
      assigneeName: json['assignee_name'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'status': status.value,
      'priority': priority.value,
      'complexity': complexity.value,
      'deadline': deadline,
      'organization_id': organizationId,
      'assignee_id': assigneeId,
      'reporter_id': reporterId,
      'reporter_name': reporterName,
      'assignee_name': assigneeName,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
