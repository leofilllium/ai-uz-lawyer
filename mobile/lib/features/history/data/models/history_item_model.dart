import '../../domain/entities/history_item.dart';

class HistoryItemModel extends HistoryItem {
  const HistoryItemModel({
    required super.id,
    required super.type,
    required super.title,
    required super.preview,
    required super.createdAt,
    required super.updatedAt,
    required super.icon,
    required super.metadata,
  });

  factory HistoryItemModel.fromJson(Map<String, dynamic> json) {
    return HistoryItemModel(
      id: json['id'] as int,
      type: json['type'] as String,
      title: json['title'] as String,
      preview: json['preview'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
      icon: json['icon'] as String? ?? '',
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'preview': preview,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'icon': icon,
      'metadata': metadata,
    };
  }
}
