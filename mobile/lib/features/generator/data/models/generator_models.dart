import '../../domain/entities/generator_entities.dart';

class ContractCategoryModel extends ContractCategory {
  const ContractCategoryModel({
    required super.id,
    required super.name,
    super.description,
    required super.templateCount,
    super.icon,
  });

  factory ContractCategoryModel.fromJson(Map<String, dynamic> json) {
    return ContractCategoryModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      templateCount: json['template_count'] ?? 0,
      icon: json['icon'],
    );
  }
}

class ContractTemplateModel extends ContractTemplate {
  const ContractTemplateModel({
    required super.id,
    required super.name,
    required super.category,
    super.description,
    required super.requiredFields,
  });

  factory ContractTemplateModel.fromJson(Map<String, dynamic> json) {
    return ContractTemplateModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      description: json['description'],
      requiredFields: (json['required_fields'] as List? ?? [])
          .map((e) => e.toString())
          .toList(),
    );
  }
}

class GeneratedContractModel extends GeneratedContract {
  const GeneratedContractModel({
    required super.id,
    required super.category,
    required super.requirements,
    required super.generatedText,
    required super.templateNames,
    super.createdAt,
  });

  factory GeneratedContractModel.fromJson(Map<String, dynamic> json) {
    return GeneratedContractModel(
      id: json['id'] ?? 0,
      category: json['category'] ?? '',
      requirements: json['requirements'] ?? '',
      generatedText: json['generated_text'] ?? '',
      templateNames: (json['template_names'] as List? ?? [])
          .map((e) => e.toString())
          .toList(),
      createdAt: json['created_at'],
    );
  }
}
