import '../../domain/entities/task_comment.dart';
import 'task_attachment_model.dart';

class TaskCommentModel extends TaskComment {
  const TaskCommentModel({
    required super.id,
    required super.taskId,
    required super.userId,
    required super.userName,
    required super.content,
    required super.createdAt,
    super.attachments,
  });

  factory TaskCommentModel.fromJson(Map<String, dynamic> json) {
    return TaskCommentModel(
      id: json['id'],
      taskId: json['task_id'],
      userId: json['user_id'],
      userName: json['user_name'],
      content: json['content'],
      createdAt: json['created_at'],
      attachments: json['attachments'] != null
          ? (json['attachments'] as List)
              .map((e) => TaskAttachmentModel.fromJson(e))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'task_id': taskId,
      'user_id': userId,
      'user_name': userName,
      'content': content,
      'created_at': createdAt,
      'attachments':
          attachments?.map((e) => (e as TaskAttachmentModel).toJson()).toList(),
    };
  }
}
