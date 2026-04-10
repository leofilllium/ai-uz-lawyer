// task_status.dart

enum TaskStatus {
  backlog('BACKLOG'),
  toDo('TO_DO'),
  inProgress('IN_PROGRESS'),
  review('REVIEW'),
  done('DONE'),
  reDo('RE_DO');

  final String value;
  const TaskStatus(this.value);

  factory TaskStatus.fromValue(String value) {
    return TaskStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => TaskStatus.toDo,
    );
  }
}

enum TaskPriority {
  low('LOW'),
  medium('MEDIUM'),
  high('HIGH'),
  urgent('URGENT');

  final String value;
  const TaskPriority(this.value);

  factory TaskPriority.fromValue(String value) {
    return TaskPriority.values.firstWhere(
      (e) => e.value == value,
      orElse: () => TaskPriority.medium,
    );
  }
}

enum TaskComplexity {
  easy('EASY'),
  medium('MEDIUM'),
  hard('HARD');

  final String value;
  const TaskComplexity(this.value);

  factory TaskComplexity.fromValue(String value) {
    return TaskComplexity.values.firstWhere(
      (e) => e.value == value,
      orElse: () => TaskComplexity.medium,
    );
  }
}
