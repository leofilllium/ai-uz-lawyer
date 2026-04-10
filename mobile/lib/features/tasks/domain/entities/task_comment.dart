import 'task_attachment.dart';

class TaskComment {
  final int id;
  final int taskId;
  final int userId;
  final String userName;
  final String content;
  final String createdAt;
  final List<TaskAttachment>? attachments;

  const TaskComment({
    required this.id,
    required this.taskId,
    required this.userId,
    required this.userName,
    required this.content,
    required this.createdAt,
    this.attachments,
  });
}
