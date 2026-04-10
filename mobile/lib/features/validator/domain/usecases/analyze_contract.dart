import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/contract_analysis.dart';
import '../repositories/validator_repository.dart';

class AnalyzeContract {
  final ValidatorRepository repository;

  AnalyzeContract(this.repository);

  Future<Either<Failure, ContractAnalysis>> call(String contractText) async {
    return await repository.analyzeContract(contractText);
  }
}
