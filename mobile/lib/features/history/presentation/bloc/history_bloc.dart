import 'package:flutter_bloc/flutter_bloc.dart';
import 'history_event.dart';
import 'history_state.dart';
import '../../domain/usecases/get_history.dart';
import '../../domain/usecases/delete_history_item.dart';

/// Manages history list state with pagination and filtering.
class HistoryBloc extends Bloc<HistoryEvent, HistoryState> {
  final GetHistory getHistory;
  final DeleteHistoryItem deleteHistoryItem;

  int _currentSkip = 0;
  final int _limit = 50;
  String _currentFilter = 'all';

  HistoryBloc({
    required this.getHistory,
    required this.deleteHistoryItem,
  }) : super(HistoryInitial()) {
    on<LoadHistory>(_onLoadHistory);
    on<LoadMoreHistory>(_onLoadMoreHistory);
    on<DeleteHistoryItemEvent>(_onDeleteHistoryItem);
  }

  Future<void> _onLoadHistory(
    LoadHistory event,
    Emitter<HistoryState> emit,
  ) async {
    emit(HistoryLoading());
    _currentSkip = 0;
    _currentFilter = event.type ?? 'all';

    final result = await getHistory(
      type: event.type == 'all' ? null : event.type,
      skip: _currentSkip,
      limit: _limit,
    );

    result.fold(
      (failure) => emit(HistoryError(failure.message)),
      (items) {
        _currentSkip += _limit;
        emit(HistoryLoaded(
          items: items,
          hasMore: items.length == _limit,
          filterType: _currentFilter,
        ));
      },
    );
  }

  Future<void> _onLoadMoreHistory(
    LoadMoreHistory event,
    Emitter<HistoryState> emit,
  ) async {
    final currentState = state;
    if (currentState is HistoryLoaded && currentState.hasMore) {
      final result = await getHistory(
        type: _currentFilter == 'all' ? null : _currentFilter,
        skip: _currentSkip,
        limit: _limit,
      );

      result.fold(
        (failure) => emit(HistoryError(failure.message)),
        (newItems) {
          _currentSkip += _limit;
          emit(HistoryLoaded(
            items: [...currentState.items, ...newItems],
            hasMore: newItems.length == _limit,
            filterType: _currentFilter,
          ));
        },
      );
    }
  }

  Future<void> _onDeleteHistoryItem(
    DeleteHistoryItemEvent event,
    Emitter<HistoryState> emit,
  ) async {
    final currentState = state;
    if (currentState is HistoryLoaded) {
      final result = await deleteHistoryItem(type: event.type, id: event.id);

      result.fold(
        (failure) => emit(HistoryError(failure.message)),
        (_) {
          final updatedItems = currentState.items
              .where(
                  (item) => !(item.type == event.type && item.id == event.id))
              .toList();

          emit(HistoryLoaded(
            items: updatedItems,
            hasMore: currentState.hasMore,
            filterType: currentState.filterType,
          ));
        },
      );
    }
  }
}
