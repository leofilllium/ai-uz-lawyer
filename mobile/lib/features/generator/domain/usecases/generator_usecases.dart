import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/generator_entities.dart';
import '../repositories/generator_repository.dart';

class GetCategories {
  final GeneratorRepository repository;

  GetCategories(this.repository);

  Future<Either<Failure, List<ContractCategory>>> call() async {
    return await repository.getCategories();
  }
}

class GenerateContract {
  final GeneratorRepository repository;

  GenerateContract(this.repository);

  Future<Either<Failure, void>> call(
      String category, String requirements) async {
    return await repository.generateContract(category, requirements);
  }

  Stream<String> get generationStream => repository.generationStream;
}
