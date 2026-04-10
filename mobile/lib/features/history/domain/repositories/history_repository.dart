import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/history_item.dart';

/// Contract for history data operations.
abstract class HistoryRepository {
  /// Fetches paginated history items, optionally filtered by [type].
  Future<Either<Failure, List<HistoryItem>>> getHistory(
      {String? type, int skip = 0, int limit = 50});

  /// Deletes a specific history item by [type] and [id].
  Future<Either<Failure, void>> deleteHistoryItem(
      {required String type, required int id});
}
