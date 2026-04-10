import 'package:equatable/equatable.dart';

abstract class TasksEvent extends Equatable {
  const TasksEvent();

  @override
  List<Object?> get props => [];
}

class LoadTasksEvent extends TasksEvent {}

class LoadTaskDetailEvent extends TasksEvent {
  final int taskId;
  const LoadTaskDetailEvent(this.taskId);

  @override
  List<Object?> get props => [taskId];
}

class CreateTaskEvent extends TasksEvent {
  final Map<String, dynamic> taskData;
  const CreateTaskEvent(this.taskData);

  @override
  List<Object?> get props => [taskData];
}

class UpdateTaskEvent extends TasksEvent {
  final int taskId;
  final Map<String, dynamic> updates;
  const UpdateTaskEvent(this.taskId, this.updates);

  @override
  List<Object?> get props => [taskId, updates];
}

class DeleteTaskEvent extends TasksEvent {
  final int taskId;
  const DeleteTaskEvent(this.taskId);

  @override
  List<Object?> get props => [taskId];
}

class AddTaskCommentEvent extends TasksEvent {
  final int taskId;
  final String content;
  const AddTaskCommentEvent(this.taskId, this.content);

  @override
  List<Object?> get props => [taskId, content];
}
