import 'package:equatable/equatable.dart';

class ContractAnalysis extends Equatable {
  final int id;
  final int? sessionId;
  final String contractText;
  final int validityScore;
  final String scoreExplanation;
  final List<ValidationError> criticalErrors;
  final List<ValidationWarning> warnings;
  final List<MissingClause> missingClauses;
  final List<String> hiddenRisks;
  final List<String> ambiguities;
  final List<String> strengths;
  final List<ImprovementSuggestion> improvementSuggestions;
  final String? negotiationStrategy;
  final List<AnalysisSource> sources;
  final String summary;
  final String? createdAt;

  const ContractAnalysis({
    required this.id,
    this.sessionId,
    required this.contractText,
    required this.validityScore,
    required this.scoreExplanation,
    required this.criticalErrors,
    required this.warnings,
    required this.missingClauses,
    required this.hiddenRisks,
    required this.ambiguities,
    this.strengths = const [],
    this.improvementSuggestions = const [],
    this.negotiationStrategy,
    this.sources = const [],
    required this.summary,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        contractText,
        validityScore,
        scoreExplanation,
        criticalErrors,
        warnings,
        missingClauses,
        hiddenRisks,
        ambiguities,
        strengths,
        improvementSuggestions,
        negotiationStrategy,
        sources,
        summary,
        createdAt,
      ];
}

class ValidationError extends Equatable {
  final String error;
  final String article;
  final String fix;

  const ValidationError({
    required this.error,
    required this.article,
    required this.fix,
  });

  @override
  List<Object?> get props => [error, article, fix];
}

class ValidationWarning extends Equatable {
  final String risk;
  final String explanation;
  final String suggestion;

  const ValidationWarning({
    required this.risk,
    required this.explanation,
    required this.suggestion,
  });

  @override
  List<Object?> get props => [risk, explanation, suggestion];
}

class MissingClause extends Equatable {
  final String clauseName;
  final String articleReference;
  final String draftedText;

  const MissingClause({
    required this.clauseName,
    required this.articleReference,
    required this.draftedText,
  });

  @override
  List<Object?> get props => [clauseName, articleReference, draftedText];
}

class ImprovementSuggestion extends Equatable {
  final String suggestion;
  final String reason;
  final String draftedText;

  const ImprovementSuggestion({
    required this.suggestion,
    required this.reason,
    required this.draftedText,
  });

  @override
  List<Object?> get props => [suggestion, reason, draftedText];
}

class AnalysisSource extends Equatable {
  final String source;
  final String article;
  final String? preview;

  const AnalysisSource({
    required this.source,
    required this.article,
    this.preview,
  });

  @override
  List<Object?> get props => [source, article, preview];
}
