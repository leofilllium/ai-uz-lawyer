import '../../domain/entities/task_attachment.dart';

class TaskAttachmentModel extends TaskAttachment {
  const TaskAttachmentModel({
    required super.id,
    required super.taskId,
    required super.filename,
    super.filePath,
    required super.fileSize,
    super.contentType,
    required super.uploadedBy,
    super.commentId,
    required super.createdAt,
  });

  factory TaskAttachmentModel.fromJson(Map<String, dynamic> json) {
    return TaskAttachmentModel(
      id: json['id'],
      taskId: json['task_id'],
      filename: json['filename'],
      filePath: json['file_path'],
      fileSize: json['file_size'],
      contentType: json['content_type'],
      uploadedBy: json['uploaded_by'],
      commentId: json['comment_id'],
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'task_id': taskId,
      'filename': filename,
      'file_path': filePath,
      'file_size': fileSize,
      'content_type': contentType,
      'uploaded_by': uploadedBy,
      'comment_id': commentId,
      'created_at': createdAt,
    };
  }
}
