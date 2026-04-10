import '../../domain/entities/contract_analysis.dart';

class ContractAnalysisModel extends ContractAnalysis {
  const ContractAnalysisModel({
    required super.id,
    super.sessionId,
    required super.contractText,
    required super.validityScore,
    required super.scoreExplanation,
    required List<ValidationErrorModel> super.criticalErrors,
    required List<ValidationWarningModel> super.warnings,
    required List<MissingClauseModel> super.missingClauses,
    required super.hiddenRisks,
    required super.ambiguities,
    required super.strengths,
    required List<ImprovementSuggestionModel> super.improvementSuggestions,
    super.negotiationStrategy,
    required List<AnalysisSourceModel> super.sources,
    required super.summary,
    super.createdAt,
  });

  factory ContractAnalysisModel.fromJson(Map<String, dynamic> json) {
    return ContractAnalysisModel(
      id: json['id'] ?? 0,
      sessionId: json['session_id'],
      contractText: json['contract_text'] ?? json['contract_preview'] ?? '',
      validityScore: json['validity_score'] ?? 0,
      scoreExplanation: json['score_explanation'] ?? '',
      criticalErrors: (json['critical_errors'] as List? ?? [])
          .map((e) => ValidationErrorModel.fromJson(e))
          .toList(),
      warnings: (json['warnings'] as List? ?? [])
          .map((e) => ValidationWarningModel.fromJson(e))
          .toList(),
      missingClauses: (json['missing_clauses'] as List? ?? [])
          .map((e) => MissingClauseModel.fromJson(e))
          .toList(),
      hiddenRisks: _parseStringList(json['hidden_risks']),
      ambiguities: _parseStringList(json['ambiguities']),
      strengths: (json['strengths'] as List? ?? []).cast<String>(),
      improvementSuggestions: (json['improvement_suggestions'] as List? ?? [])
          .map((e) => ImprovementSuggestionModel.fromJson(e))
          .toList(),
      negotiationStrategy: json['negotiation_strategy'],
      sources: (json['sources'] as List? ?? [])
          .map((e) => AnalysisSourceModel.fromJson(e))
          .toList(),
      summary: json['summary'] ?? '',
      createdAt: json['created_at'],
    );
  }

  /// Parses hidden_risks / ambiguities which can be List<String> or
  /// List<Map> with a 'risk'/'phrase' key.
  static List<String> _parseStringList(dynamic value) {
    if (value == null) return [];
    if (value is! List) return [];
    return value.map<String>((e) {
      if (e is String) return e;
      if (e is Map) return e['risk'] ?? e['phrase'] ?? e.toString();
      return e.toString();
    }).toList();
  }
}

class ValidationErrorModel extends ValidationError {
  const ValidationErrorModel({
    required super.error,
    required super.article,
    required super.fix,
  });

  factory ValidationErrorModel.fromJson(Map<String, dynamic> json) {
    return ValidationErrorModel(
      error: json['error'] ?? '',
      article: json['article'] ?? '',
      fix: json['fix'] ?? '',
    );
  }
}

class ValidationWarningModel extends ValidationWarning {
  const ValidationWarningModel({
    required super.risk,
    required super.explanation,
    required super.suggestion,
  });

  factory ValidationWarningModel.fromJson(Map<String, dynamic> json) {
    return ValidationWarningModel(
      risk: json['risk'] ?? '',
      explanation: json['explanation'] ?? '',
      suggestion: json['suggestion'] ?? '',
    );
  }
}

class MissingClauseModel extends MissingClause {
  const MissingClauseModel({
    required super.clauseName,
    required super.articleReference,
    required super.draftedText,
  });

  factory MissingClauseModel.fromJson(Map<String, dynamic> json) {
    return MissingClauseModel(
      clauseName: json['clause_name'] ?? '',
      articleReference: json['article_reference'] ?? '',
      draftedText: json['drafted_text'] ?? '',
    );
  }
}

class ImprovementSuggestionModel extends ImprovementSuggestion {
  const ImprovementSuggestionModel({
    required super.suggestion,
    required super.reason,
    required super.draftedText,
  });

  factory ImprovementSuggestionModel.fromJson(Map<String, dynamic> json) {
    return ImprovementSuggestionModel(
      suggestion: json['suggestion'] ?? '',
      reason: json['reason'] ?? '',
      draftedText: json['drafted_text'] ?? '',
    );
  }
}

class AnalysisSourceModel extends AnalysisSource {
  const AnalysisSourceModel({
    required super.source,
    required super.article,
    super.preview,
  });

  factory AnalysisSourceModel.fromJson(Map<String, dynamic> json) {
    return AnalysisSourceModel(
      source: json['source'] ?? '',
      article: json['article'] ?? '',
      preview: json['preview'],
    );
  }
}
