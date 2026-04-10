import '../../domain/entities/task_detail.dart';
import '../../domain/entities/task_enums.dart';
import 'task_attachment_model.dart';
import 'task_comment_model.dart';

class TaskDetailModel extends TaskDetail {
  const TaskDetailModel({
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
    required super.comments,
    required super.attachments,
  });

  factory TaskDetailModel.fromJson(Map<String, dynamic> json) {
    return TaskDetailModel(
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
      comments: json['comments'] != null
          ? (json['comments'] as List)
              .map((e) => TaskCommentModel.fromJson(e))
              .toList()
          : [],
      attachments: json['attachments'] != null
          ? (json['attachments'] as List)
              .map((e) => TaskAttachmentModel.fromJson(e))
              .toList()
          : [],
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
      'comments':
          comments.map((e) => (e as TaskCommentModel).toJson()).toList(),
      'attachments':
          attachments.map((e) => (e as TaskAttachmentModel).toJson()).toList(),
    };
  }
}
