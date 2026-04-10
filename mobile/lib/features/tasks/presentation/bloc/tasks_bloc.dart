import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/tasks_repository.dart';
import 'tasks_event.dart';
import 'tasks_state.dart';

class TasksBloc extends Bloc<TasksEvent, TasksState> {
  final TasksRepository _tasksRepository;

  TasksBloc(this._tasksRepository) : super(TasksInitial()) {
    on<LoadTasksEvent>(_onLoadTasks);
    on<LoadTaskDetailEvent>(_onLoadTaskDetail);
    on<CreateTaskEvent>(_onCreateTask);
    on<UpdateTaskEvent>(_onUpdateTask);
    on<DeleteTaskEvent>(_onDeleteTask);
    on<AddTaskCommentEvent>(_onAddTaskComment);
  }

  Future<void> _onLoadTasks(
      LoadTasksEvent event, Emitter<TasksState> emit) async {
    emit(TasksLoading());
    try {
      final tasks = await _tasksRepository.getTasks();
      emit(TasksLoaded(tasks));
    } catch (e) {
      emit(TasksError(e.toString()));
    }
  }

  Future<void> _onLoadTaskDetail(
      LoadTaskDetailEvent event, Emitter<TasksState> emit) async {
    emit(TasksLoading());
    try {
      final detail = await _tasksRepository.getTask(event.taskId);
      emit(TaskDetailLoaded(detail));
    } catch (e) {
      emit(TasksError(e.toString()));
    }
  }

  Future<void> _onCreateTask(
      CreateTaskEvent event, Emitter<TasksState> emit) async {
    emit(TasksLoading());
    try {
      await _tasksRepository.createTask(event.taskData);
      emit(const TaskOperationSuccess('Task created successfully'));
      // Reload tasks after creation
      add(LoadTasksEvent());
    } catch (e) {
      emit(TasksError(e.toString()));
    }
  }

  Future<void> _onUpdateTask(
      UpdateTaskEvent event, Emitter<TasksState> emit) async {
    final currentState = state;
    emit(TasksLoading());
    try {
      await _tasksRepository.updateTask(event.taskId, event.updates);
      emit(const TaskOperationSuccess('Task updated successfully'));

      // Depending on previous state we might want to reload detail or list
      if (currentState is TaskDetailLoaded &&
          currentState.taskDetail.id == event.taskId) {
        add(LoadTaskDetailEvent(event.taskId));
      } else {
        add(LoadTasksEvent());
      }
    } catch (e) {
      emit(TasksError(e.toString()));
    }
  }

  Future<void> _onDeleteTask(
      DeleteTaskEvent event, Emitter<TasksState> emit) async {
    emit(TasksLoading());
    try {
      await _tasksRepository.deleteTask(event.taskId);
      emit(const TaskOperationSuccess('Task deleted successfully'));
      add(LoadTasksEvent());
    } catch (e) {
      emit(TasksError(e.toString()));
    }
  }

  Future<void> _onAddTaskComment(
      AddTaskCommentEvent event, Emitter<TasksState> emit) async {
    final currentState = state;
    emit(TasksLoading());
    try {
      await _tasksRepository.addTaskComment(event.taskId, event.content);
      emit(const TaskOperationSuccess('Comment added'));

      // Reload detail if we were viewing it
      if (currentState is TaskDetailLoaded &&
          currentState.taskDetail.id == event.taskId) {
        add(LoadTaskDetailEvent(event.taskId));
      } else {
        add(LoadTaskDetailEvent(event.taskId));
      }
    } catch (e) {
      emit(TasksError(e.toString()));
    }
  }
}
