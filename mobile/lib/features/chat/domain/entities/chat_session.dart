import 'package:equatable/equatable.dart';

class ChatSession extends Equatable {
  final int id;
  final String title;
  final String sessionType;
  final String? updatedAt;
  final int messageCount;

  const ChatSession({
    required this.id,
    required this.title,
    required this.sessionType,
    this.updatedAt,
    required this.messageCount,
  });

  @override
  List<Object?> get props => [id, title, sessionType, updatedAt, messageCount];
}
