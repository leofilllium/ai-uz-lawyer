abstract class HistoryEvent {
  const HistoryEvent();
}

class LoadHistory extends HistoryEvent {
  final String? type;

  const LoadHistory({this.type});
}

class LoadMoreHistory extends HistoryEvent {
  const LoadMoreHistory();
}

class DeleteHistoryItemEvent extends HistoryEvent {
  final String type;
  final int id;

  const DeleteHistoryItemEvent({required this.type, required this.id});
}
