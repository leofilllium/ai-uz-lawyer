import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/history_item.dart';
import '../repositories/history_repository.dart';

/// Fetches paginated history items from the repository.
class GetHistory {
  final HistoryRepository repository;

  GetHistory(this.repository);

  Future<Either<Failure, List<HistoryItem>>> call(
      {String? type, int skip = 0, int limit = 50}) {
    return repository.getHistory(type: type, skip: skip, limit: limit);
  }
}
