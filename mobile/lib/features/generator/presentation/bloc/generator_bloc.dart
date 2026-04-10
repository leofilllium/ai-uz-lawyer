import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/generator_usecases.dart';
import '../../domain/usecases/get_generator_history.dart';
import 'generator_event.dart';
import 'generator_state.dart';

export 'generator_event.dart';
export 'generator_state.dart';

class GeneratorBloc extends Bloc<GeneratorEvent, GeneratorState> {
  final GetCategories getCategories;
  final GenerateContract generateContract;
  final GetGeneratorHistory getGeneratorHistory;

  StreamSubscription? _generationSubscription;

  GeneratorBloc({
    required this.getCategories,
    required this.generateContract,
    required this.getGeneratorHistory,
  }) : super(const GeneratorState()) {
    on<LoadCategories>(_onLoadCategories);
    on<GenerateContractRequested>(_onGenerateContractRequested);
    on<GeneratorUsageChunkReceived>(_onChunkReceived);
    on<GeneratorStreamError>(_onStreamError);
    on<ResetGenerator>(_onReset);
    on<LoadGeneratorHistory>(_onLoadHistory);
    on<LoadGeneratedContract>((event, emit) => emit(state.copyWith(
          status: GeneratorStatus.success,
          fullContract: event.contract.generatedText,
        )));
  }

  Future<void> _onLoadCategories(
      LoadCategories event, Emitter<GeneratorState> emit) async {
    emit(state.copyWith(status: GeneratorStatus.loading));
    final result = await getCategories();
    result.fold(
      (failure) => emit(state.copyWith(
        status: GeneratorStatus.error,
        errorMessage: failure.message,
      )),
      (categories) => emit(state.copyWith(
        status: GeneratorStatus.success,
        categories: categories,
      )),
    );
  }

  Future<void> _onGenerateContractRequested(
      GenerateContractRequested event, Emitter<GeneratorState> emit) async {
    emit(state.copyWith(
      status: GeneratorStatus.generating,
      generatedContent: '',
    ));

    await _generationSubscription?.cancel();
    _generationSubscription = generateContract.generationStream.listen(
      (chunk) => add(GeneratorUsageChunkReceived(chunk)),
      onError: (error) => add(GeneratorStreamError(error.toString())),
    );

    final result = await generateContract(event.category, event.requirements);

    result.fold(
      (failure) => emit(state.copyWith(
        status: GeneratorStatus.error,
        errorMessage: failure.message,
      )),
      (_) {}, // Success handled by stream
    );
  }

  void _onChunkReceived(
      GeneratorUsageChunkReceived event, Emitter<GeneratorState> emit) {
    if (state.status == GeneratorStatus.generating) {
      emit(state.copyWith(
        generatedContent: state.generatedContent + event.chunk,
      ));
    }
  }

  void _onStreamError(
      GeneratorStreamError event, Emitter<GeneratorState> emit) {
    emit(state.copyWith(
      status: GeneratorStatus.error,
      errorMessage: event.error,
    ));
  }

  void _onReset(ResetGenerator event, Emitter<GeneratorState> emit) {
    emit(state.copyWith(
      status: GeneratorStatus.initial,
      fullContract: null,
      generatedContent: '',
    ));
    add(LoadCategories());
  }

  Future<void> _onLoadHistory(
      LoadGeneratorHistory event, Emitter<GeneratorState> emit) async {
    emit(state.copyWith(status: GeneratorStatus.loading));
    final result = await getGeneratorHistory();
    result.fold(
      (failure) => emit(state.copyWith(
        status: GeneratorStatus.error,
        errorMessage: failure.message,
      )),
      (history) => emit(state.copyWith(
        status: GeneratorStatus.success,
        history: history,
      )),
    );
  }

  @override
  Future<void> close() {
    _generationSubscription?.cancel();
    return super.close();
  }
}
