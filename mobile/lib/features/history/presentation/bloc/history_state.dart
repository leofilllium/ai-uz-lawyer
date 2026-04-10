import '../../domain/entities/history_item.dart';

abstract class HistoryState {
  const HistoryState();
}

class HistoryInitial extends HistoryState {}

class HistoryLoading extends HistoryState {}

class HistoryLoaded extends HistoryState {
  final List<HistoryItem> items;
  final bool hasMore;
  final String filterType;

  const HistoryLoaded({
    required this.items,
    required this.hasMore,
    required this.filterType,
  });
}

class HistoryError extends HistoryState {
  final String message;

  const HistoryError(this.message);
}
