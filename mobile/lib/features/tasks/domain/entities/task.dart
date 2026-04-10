import 'task_enums.dart';

class Task {
  final int id;
  final String title;
  final String? description;
  final TaskStatus status;
  final TaskPriority priority;
  final TaskComplexity complexity;
  final String? deadline;
  final int organizationId;
  final int? assigneeId;
  final int reporterId;
  final String? reporterName;
  final String? assigneeName;
  final String createdAt;
  final String updatedAt;

  const Task({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    required this.complexity,
    this.deadline,
    required this.organizationId,
    this.assigneeId,
    required this.reporterId,
    this.reporterName,
    this.assigneeName,
    required this.createdAt,
    required this.updatedAt,
  });
}
