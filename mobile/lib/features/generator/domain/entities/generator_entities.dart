import 'package:equatable/equatable.dart';

class ContractCategory extends Equatable {
  final String id;
  final String name;
  final String? description;
  final int templateCount;
  final String? icon;

  const ContractCategory({
    required this.id,
    required this.name,
    this.description,
    required this.templateCount,
    this.icon,
  });

  @override
  List<Object?> get props => [id, name, description, templateCount, icon];
}

class ContractTemplate extends Equatable {
  final String id;
  final String name;
  final String category;
  final String? description;
  final List<String> requiredFields;

  const ContractTemplate({
    required this.id,
    required this.name,
    required this.category,
    this.description,
    required this.requiredFields,
  });

  @override
  List<Object?> get props => [id, name, category, description, requiredFields];
}

class GeneratedContract extends Equatable {
  final int id;
  final String category;
  final String requirements;
  final String generatedText;
  final List<String> templateNames;
  final String? createdAt;

  const GeneratedContract({
    required this.id,
    required this.category,
    required this.requirements,
    required this.generatedText,
    required this.templateNames,
    this.createdAt,
  });

  @override
  List<Object?> get props =>
      [id, category, requirements, generatedText, templateNames, createdAt];
}
