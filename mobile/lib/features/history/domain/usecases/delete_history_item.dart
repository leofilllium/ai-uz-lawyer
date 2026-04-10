import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/history_repository.dart';

/// Deletes a specific history item by type and ID.
class DeleteHistoryItem {
  final HistoryRepository repository;

  DeleteHistoryItem(this.repository);

  Future<Either<Failure, void>> call({required String type, required int id}) {
    return repository.deleteHistoryItem(type: type, id: id);
  }
}
