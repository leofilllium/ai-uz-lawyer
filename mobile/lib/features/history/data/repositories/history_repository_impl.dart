import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_handler.dart';
import '../../domain/entities/history_item.dart';
import '../../domain/repositories/history_repository.dart';
import '../datasources/history_remote_data_source.dart';

class HistoryRepositoryImpl implements HistoryRepository {
  final HistoryRemoteDataSource remoteDataSource;

  HistoryRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<HistoryItem>>> getHistory(
      {String? type, int skip = 0, int limit = 50}) async {
    return ApiHandler.call(() => remoteDataSource.getHistory(
          type: type == 'all' ? null : type,
          skip: skip,
          limit: limit,
        ));
  }

  @override
  Future<Either<Failure, void>> deleteHistoryItem(
      {required String type, required int id}) async {
    return ApiHandler.call(
        () => remoteDataSource.deleteHistoryItem(type: type, id: id));
  }
}
