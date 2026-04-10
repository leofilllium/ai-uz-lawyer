import 'package:equatable/equatable.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/chat_session.dart';

abstract class ChatState extends Equatable {
  const ChatState();

  @override
  List<Object?> get props => [];
}

class ChatInitial extends ChatState {}

class ChatLoading extends ChatState {}

class ChatSessionsLoaded extends ChatState {
  final List<ChatSession> sessions;
  const ChatSessionsLoaded(this.sessions);

  @override
  List<Object?> get props => [sessions];
}

class ChatMessagesLoaded extends ChatState {
  final List<ChatMessage> messages;
  final int sessionId;
  final String streamingContent;
  final bool isStreaming;

  const ChatMessagesLoaded({
    required this.messages,
    required this.sessionId,
    this.streamingContent = '',
    this.isStreaming = false,
  });

  ChatMessagesLoaded copyWith({
    List<ChatMessage>? messages,
    int? sessionId,
    String? streamingContent,
    bool? isStreaming,
  }) {
    return ChatMessagesLoaded(
      messages: messages ?? this.messages,
      sessionId: sessionId ?? this.sessionId,
      streamingContent: streamingContent ?? this.streamingContent,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }

  @override
  List<Object?> get props =>
      [messages, sessionId, streamingContent, isStreaming];
}

class ChatError extends ChatState {
  final String message;
  const ChatError(this.message);

  @override
  List<Object?> get props => [message];
}
