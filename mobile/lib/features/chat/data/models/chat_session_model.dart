import '../../domain/entities/chat_session.dart';

class ChatSessionModel extends ChatSession {
  const ChatSessionModel({
    required super.id,
    required super.title,
    required super.sessionType,
    super.updatedAt,
    required super.messageCount,
  });

  factory ChatSessionModel.fromJson(Map<String, dynamic> json) {
    return ChatSessionModel(
      id: json['id'],
      title: json['title'],
      sessionType: json['session_type'],
      updatedAt: json['updated_at'],
      messageCount: json['message_count'],
    );
  }
}
