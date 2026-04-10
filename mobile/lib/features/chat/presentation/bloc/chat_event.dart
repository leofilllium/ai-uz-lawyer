import 'package:equatable/equatable.dart';

abstract class ChatEvent extends Equatable {
  const ChatEvent();

  @override
  List<Object?> get props => [];
}

class LoadChatSessions extends ChatEvent {}

class LoadSessionMessages extends ChatEvent {
  final int sessionId;
  const LoadSessionMessages(this.sessionId);

  @override
  List<Object?> get props => [sessionId];
}

class SendChatMessage extends ChatEvent {
  final String message;
  final int? sessionId;
  final String mode;

  const SendChatMessage(this.message,
      {this.sessionId, this.mode = 'risk-manager'});

  @override
  List<Object?> get props => [message, sessionId, mode];
}

class ChatMessageChunkReceived extends ChatEvent {
  final String chunk;
  const ChatMessageChunkReceived(this.chunk);

  @override
  List<Object?> get props => [chunk];
}

class ChatStreamError extends ChatEvent {
  final String error;
  const ChatStreamError(this.error);

  @override
  List<Object?> get props => [error];
}
