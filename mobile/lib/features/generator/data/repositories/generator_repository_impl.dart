import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_handler.dart';
import '../../domain/entities/generator_entities.dart';
import '../../domain/repositories/generator_repository.dart';
import '../datasources/generator_remote_data_source.dart';

class GeneratorRepositoryImpl implements GeneratorRepository {
  final GeneratorRemoteDataSource remoteDataSource;

  GeneratorRepositoryImpl({required this.remoteDataSource});

  @override
  Stream<String> get generationStream => remoteDataSource.generationStream;

  @override
  Future<Either<Failure, List<ContractCategory>>> getCategories() async {
    return ApiHandler.call(() => remoteDataSource.getCategories());
  }

  @override
  Future<Either<Failure, void>> generateContract(
      String category, String requirements) async {
    return ApiHandler.call(() async {
      await remoteDataSource.generateContract(category, requirements);
    });
  }

  @override
  Future<Either<Failure, List<GeneratedContract>>> getHistory() async {
    return ApiHandler.call(() => remoteDataSource.getHistory());
  }
}
