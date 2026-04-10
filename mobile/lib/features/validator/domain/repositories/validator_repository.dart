import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/contract_analysis.dart';

abstract class ValidatorRepository {
  Future<Either<Failure, ContractAnalysis>> analyzeContract(
      String contractText);
  Future<Either<Failure, List<ContractAnalysis>>> getHistory();
}
