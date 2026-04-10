import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/generator_entities.dart';

abstract class GeneratorRepository {
  Future<Either<Failure, List<ContractCategory>>> getCategories();
  Future<Either<Failure, void>> generateContract(
      String category, String requirements);
  Future<Either<Failure, List<GeneratedContract>>> getHistory();
  Stream<String> get generationStream;
}
