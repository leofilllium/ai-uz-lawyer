import 'package:equatable/equatable.dart';
import '../../domain/entities/contract_analysis.dart';

abstract class ValidatorEvent extends Equatable {
  const ValidatorEvent();

  @override
  List<Object?> get props => [];
}

class ValidateContractRequested extends ValidatorEvent {
  final String contractText;
  const ValidateContractRequested(this.contractText);

  @override
  List<Object?> get props => [contractText];
}

class LoadValidationHistory extends ValidatorEvent {}

class LoadContractAnalysis extends ValidatorEvent {
  final ContractAnalysis analysis;
  const LoadContractAnalysis(this.analysis);

  @override
  List<Object?> get props => [analysis];
}

class ResetValidator extends ValidatorEvent {}
