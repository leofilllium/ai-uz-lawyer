import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/contract_analysis.dart';
import '../repositories/validator_repository.dart';

class GetValidationHistory {
  final ValidatorRepository repository;

  GetValidationHistory(this.repository);

  Future<Either<Failure, List<ContractAnalysis>>> call() async {
    return await repository.getHistory();
  }
}
