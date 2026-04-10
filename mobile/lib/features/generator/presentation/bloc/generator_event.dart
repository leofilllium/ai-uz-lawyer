import 'package:equatable/equatable.dart';
import '../../domain/entities/generator_entities.dart';

abstract class GeneratorEvent extends Equatable {
  const GeneratorEvent();

  @override
  List<Object?> get props => [];
}

class LoadCategories extends GeneratorEvent {}

class GenerateContractRequested extends GeneratorEvent {
  final String category;
  final String requirements;

  const GenerateContractRequested({
    required this.category,
    required this.requirements,
  });

  @override
  List<Object?> get props => [category, requirements];
}

class GeneratorUsageChunkReceived extends GeneratorEvent {
  final String chunk;
  const GeneratorUsageChunkReceived(this.chunk);

  @override
  List<Object?> get props => [chunk];
}

class GeneratorStreamError extends GeneratorEvent {
  final String error;
  const GeneratorStreamError(this.error);

  @override
  List<Object?> get props => [error];
}

class ResetGenerator extends GeneratorEvent {}

class LoadGeneratorHistory extends GeneratorEvent {}

class LoadGeneratedContract extends GeneratorEvent {
  final GeneratedContract contract;
  const LoadGeneratedContract(this.contract);

  @override
  List<Object?> get props => [contract];
}
