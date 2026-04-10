import 'package:equatable/equatable.dart';

class ChatMessage extends Equatable {
  final int id;
  final int sessionId;
  final String role; // 'user' or 'assistant'
  final String content;
  final List<Source>? sources;
  final String? createdAt;

  const ChatMessage({
    required this.id,
    required this.sessionId,
    required this.role,
    required this.content,
    this.sources,
    this.createdAt,
  });

  bool get isUser => role == 'user';

  @override
  List<Object?> get props => [id, sessionId, role, content, sources, createdAt];
}

class Source extends Equatable {
  final String? article;
  final String? source;
  final String? title;
  final String? preview;

  const Source({
    this.article,
    this.source,
    this.title,
    this.preview,
  });

  @override
  List<Object?> get props => [article, source, title, preview];
}
