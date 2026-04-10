import 'package:equatable/equatable.dart';
import '../../domain/entities/contract_analysis.dart';

abstract class ValidatorState extends Equatable {
  const ValidatorState();

  @override
  List<Object?> get props => [];
}

class ValidatorInitial extends ValidatorState {}

class ValidatorLoading extends ValidatorState {}

class ValidatorSuccess extends ValidatorState {
  final ContractAnalysis analysis;
  const ValidatorSuccess(this.analysis);

  @override
  List<Object?> get props => [analysis];
}

class ValidatorHistoryLoaded extends ValidatorState {
  final List<ContractAnalysis> history;
  const ValidatorHistoryLoaded(this.history);

  @override
  List<Object?> get props => [history];
}

class ValidatorError extends ValidatorState {
  final String message;
  const ValidatorError(this.message);

  @override
  List<Object?> get props => [message];
}
