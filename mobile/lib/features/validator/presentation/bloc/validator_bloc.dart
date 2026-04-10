import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/analyze_contract.dart';
import '../../domain/usecases/get_validation_history.dart';
import 'validator_event.dart';
import 'validator_state.dart';

class ValidatorBloc extends Bloc<ValidatorEvent, ValidatorState> {
  final AnalyzeContract analyzeContract;
  final GetValidationHistory getValidationHistory;

  ValidatorBloc({
    required this.analyzeContract,
    required this.getValidationHistory,
  }) : super(ValidatorInitial()) {
    on<ValidateContractRequested>(_onValidateContractRequested);
    on<LoadValidationHistory>(_onLoadValidationHistory);
    on<LoadContractAnalysis>(
        (event, emit) => emit(ValidatorSuccess(event.analysis)));
    on<ResetValidator>((event, emit) => emit(ValidatorInitial()));
  }

  Future<void> _onValidateContractRequested(
      ValidateContractRequested event, Emitter<ValidatorState> emit) async {
    emit(ValidatorLoading());
    final result = await analyzeContract(event.contractText);
    result.fold(
      (failure) => emit(ValidatorError(failure.message)),
      (analysis) => emit(ValidatorSuccess(analysis)),
    );
  }

  Future<void> _onLoadValidationHistory(
      LoadValidationHistory event, Emitter<ValidatorState> emit) async {
    emit(ValidatorLoading());
    final result = await getValidationHistory();
    result.fold(
      (failure) => emit(ValidatorError(failure.message)),
      (history) => emit(ValidatorHistoryLoaded(history)),
    );
  }
}
