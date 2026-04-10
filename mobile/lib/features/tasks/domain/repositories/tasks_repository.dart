import 'dart:io';

import '../../domain/entities/task.dart';
import '../../domain/entities/task_attachment.dart';
import '../../domain/entities/task_comment.dart';
import '../../domain/entities/task_detail.dart';

abstract class TasksRepository {
  Future<List<Task>> getTasks();
  Future<TaskDetail> getTask(int taskId);
  Future<Task> createTask(Map<String, dynamic> task);
  Future<Task> updateTask(int taskId, Map<String, dynamic> updates);
  Future<void> deleteTask(int taskId);

  Future<List<TaskComment>> getTaskComments(int taskId);
  Future<TaskComment> addTaskComment(int taskId, String content);
  Future<void> deleteTaskComment(int taskId, int commentId);

  Future<List<TaskAttachment>> getTaskAttachments(int taskId);
  Future<TaskAttachment> uploadTaskAttachment(int taskId, File file,
      {int? commentId});
  Future<void> deleteTaskAttachment(int taskId, int attachmentId);
}
