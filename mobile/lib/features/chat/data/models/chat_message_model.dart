import '../../domain/entities/chat_message.dart';

class ChatMessageModel extends ChatMessage {
  const ChatMessageModel({
    required super.id,
    required super.sessionId,
    required super.role,
    required super.content,
    super.sources,
    super.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'],
      sessionId: json['session_id'],
      role: json['role'],
      content: json['content'],
      sources: json['sources'] != null
          ? (json['sources'] as List)
              .map((e) => SourceModel.fromJson(e))
              .toList()
          : null,
      createdAt: json['created_at'],
    );
  }
}

class SourceModel extends Source {
  const SourceModel({
    super.article,
    super.source,
    super.title,
    super.preview,
  });

  factory SourceModel.fromJson(Map<String, dynamic> json) {
    return SourceModel(
      article: json['article'],
      source: json['source'],
      title: json['title'],
      preview: json['preview'],
    );
  }
}
