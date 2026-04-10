import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_handler.dart';
import '../../domain/entities/contract_analysis.dart';
import '../../domain/repositories/validator_repository.dart';
import '../datasources/validator_remote_data_source.dart';

class ValidatorRepositoryImpl implements ValidatorRepository {
  final ValidatorRemoteDataSource remoteDataSource;

  ValidatorRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, ContractAnalysis>> analyzeContract(
      String contractText) async {
    return ApiHandler.call(
        () => remoteDataSource.analyzeContract(contractText));
  }

  @override
  Future<Either<Failure, List<ContractAnalysis>>> getHistory() async {
    return ApiHandler.call(() => remoteDataSource.getHistory());
  }
}
