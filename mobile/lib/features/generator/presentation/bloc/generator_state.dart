import 'package:equatable/equatable.dart';
import '../../domain/entities/generator_entities.dart';

enum GeneratorStatus { initial, loading, success, error, generating }

class GeneratorState extends Equatable {
  final GeneratorStatus status;
  final List<ContractCategory> categories;
  final List<GeneratedContract> history;
  final String? errorMessage;
  final String generatedContent;
  final String? fullContract;

  const GeneratorState({
    this.status = GeneratorStatus.initial,
    this.categories = const [],
    this.history = const [],
    this.errorMessage,
    this.generatedContent = '',
    this.fullContract,
  });

  GeneratorState copyWith({
    GeneratorStatus? status,
    List<ContractCategory>? categories,
    List<GeneratedContract>? history,
    String? errorMessage,
    String? generatedContent,
    String? fullContract,
  }) {
    return GeneratorState(
      status: status ?? this.status,
      categories: categories ?? this.categories,
      history: history ?? this.history,
      errorMessage: errorMessage ?? this.errorMessage,
      generatedContent: generatedContent ?? this.generatedContent,
      fullContract: fullContract ?? this.fullContract,
    );
  }

  @override
  List<Object?> get props => [
        status,
        categories,
        history,
        errorMessage,
        generatedContent,
        fullContract,
      ];
}
