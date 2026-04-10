import 'dart:io';

import '../../domain/entities/task.dart';
import '../../domain/entities/task_attachment.dart';
import '../../domain/entities/task_comment.dart';
import '../../domain/entities/task_detail.dart';
import '../../domain/repositories/tasks_repository.dart';
import '../datasources/tasks_remote_data_source.dart';

class TasksRepositoryImpl implements TasksRepository {
  final TasksRemoteDataSource _remoteDataSource;

  TasksRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<Task>> getTasks() async {
    return await _remoteDataSource.getTasks();
  }

  @override
  Future<TaskDetail> getTask(int taskId) async {
    return await _remoteDataSource.getTask(taskId);
  }

  @override
  Future<Task> createTask(Map<String, dynamic> task) async {
    return await _remoteDataSource.createTask(task);
  }

  @override
  Future<Task> updateTask(int taskId, Map<String, dynamic> updates) async {
    return await _remoteDataSource.updateTask(taskId, updates);
  }

  @override
  Future<void> deleteTask(int taskId) async {
    return await _remoteDataSource.deleteTask(taskId);
  }

  @override
  Future<List<TaskComment>> getTaskComments(int taskId) async {
    return await _remoteDataSource.getTaskComments(taskId);
  }

  @override
  Future<TaskComment> addTaskComment(int taskId, String content) async {
    return await _remoteDataSource.addTaskComment(taskId, content);
  }

  @override
  Future<void> deleteTaskComment(int taskId, int commentId) async {
    return await _remoteDataSource.deleteTaskComment(taskId, commentId);
  }

  @override
  Future<List<TaskAttachment>> getTaskAttachments(int taskId) async {
    return await _remoteDataSource.getTaskAttachments(taskId);
  }

  @override
  Future<TaskAttachment> uploadTaskAttachment(int taskId, File file,
      {int? commentId}) async {
    return await _remoteDataSource.uploadTaskAttachment(taskId, file,
        commentId: commentId);
  }

  @override
  Future<void> deleteTaskAttachment(int taskId, int attachmentId) async {
    return await _remoteDataSource.deleteTaskAttachment(taskId, attachmentId);
  }
}
