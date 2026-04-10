class TaskAttachment {
  final int id;
  final int taskId;
  final String filename;
  final String? filePath;
  final int fileSize;
  final String? contentType;
  final int uploadedBy;
  final int? commentId;
  final String createdAt;

  const TaskAttachment({
    required this.id,
    required this.taskId,
    required this.filename,
    this.filePath,
    required this.fileSize,
    this.contentType,
    required this.uploadedBy,
    this.commentId,
    required this.createdAt,
  });
}
