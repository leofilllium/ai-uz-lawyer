import 'task.dart';
import 'task_attachment.dart';
import 'task_comment.dart';

class TaskDetail extends Task {
  final List<TaskComment> comments;
  final List<TaskAttachment> attachments;

  const TaskDetail({
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
    required this.comments,
    required this.attachments,
  });
}
