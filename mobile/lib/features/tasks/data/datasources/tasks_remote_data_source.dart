import 'dart:io';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../data/models/task_model.dart';
import '../../data/models/task_comment_model.dart';
import '../../data/models/task_attachment_model.dart';
import '../../data/models/task_detail_model.dart';

class TasksRemoteDataSource {
  final ApiClient _apiClient;

  TasksRemoteDataSource(this._apiClient);

  Future<List<TaskModel>> getTasks() async {
    final response = await _apiClient.get(ApiConstants.tasks);
    return (response.data as List).map((e) => TaskModel.fromJson(e)).toList();
  }

  Future<TaskDetailModel> getTask(int taskId) async {
    final response = await _apiClient.get('${ApiConstants.tasks}$taskId');
    return TaskDetailModel.fromJson(response.data);
  }

  Future<TaskModel> createTask(Map<String, dynamic> task) async {
    final response = await _apiClient.post(ApiConstants.tasks, data: task);
    return TaskModel.fromJson(response.data);
  }

  Future<TaskModel> updateTask(int taskId, Map<String, dynamic> updates) async {
    final response =
        await _apiClient.put('${ApiConstants.tasks}$taskId', data: updates);
    return TaskModel.fromJson(response.data);
  }

  Future<void> deleteTask(int taskId) async {
    await _apiClient.delete('${ApiConstants.tasks}$taskId');
  }

  Future<List<TaskCommentModel>> getTaskComments(int taskId) async {
    final response =
        await _apiClient.get('${ApiConstants.tasks}$taskId/comments');
    return (response.data as List)
        .map((e) => TaskCommentModel.fromJson(e))
        .toList();
  }

  Future<TaskCommentModel> addTaskComment(int taskId, String content) async {
    final response = await _apiClient.post(
      '${ApiConstants.tasks}$taskId/comments',
      data: {'content': content},
    );
    return TaskCommentModel.fromJson(response.data);
  }

  Future<void> deleteTaskComment(int taskId, int commentId) async {
    await _apiClient.delete('${ApiConstants.tasks}$taskId/comments/$commentId');
  }

  Future<List<TaskAttachmentModel>> getTaskAttachments(int taskId) async {
    final response =
        await _apiClient.get('${ApiConstants.tasks}$taskId/attachments');
    return (response.data as List)
        .map((e) => TaskAttachmentModel.fromJson(e))
        .toList();
  }

  Future<TaskAttachmentModel> uploadTaskAttachment(
    int taskId,
    File file, {
    int? commentId,
  }) async {
    String filename = file.path.split('/').last;
    FormData formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: filename),
    });

    String url = '${ApiConstants.tasks}$taskId/attachments';
    if (commentId != null) {
      url += '?comment_id=$commentId';
    }

    final response = await _apiClient.post(url, data: formData);
    return TaskAttachmentModel.fromJson(response.data);
  }

  Future<void> deleteTaskAttachment(int taskId, int attachmentId) async {
    await _apiClient
        .delete('${ApiConstants.tasks}$taskId/attachments/$attachmentId');
  }
}
