import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/generator_entities.dart';
import '../repositories/generator_repository.dart';

class GetGeneratorHistory {
  final GeneratorRepository repository;

  GetGeneratorHistory(this.repository);

  Future<Either<Failure, List<GeneratedContract>>> call() async {
    return await repository.getHistory();
  }
}
