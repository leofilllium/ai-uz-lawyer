import 'package:equatable/equatable.dart';
import '../../domain/entities/task.dart';
import '../../domain/entities/task_detail.dart';

abstract class TasksState extends Equatable {
  const TasksState();

  @override
  List<Object?> get props => [];
}

class TasksInitial extends TasksState {}

class TasksLoading extends TasksState {}

class TasksLoaded extends TasksState {
  final List<Task> tasks;
  const TasksLoaded(this.tasks);

  @override
  List<Object?> get props => [tasks];
}

class TaskDetailLoaded extends TasksState {
  final TaskDetail taskDetail;
  const TaskDetailLoaded(this.taskDetail);

  @override
  List<Object?> get props => [taskDetail];
}

class TasksError extends TasksState {
  final String message;
  const TasksError(this.message);

  @override
  List<Object?> get props => [message];
}

class TaskOperationSuccess extends TasksState {
  final String message;
  const TaskOperationSuccess(this.message);

  @override
  List<Object?> get props => [message];
}
