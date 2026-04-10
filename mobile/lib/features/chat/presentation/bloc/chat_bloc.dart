import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/usecases/get_chat_messages.dart';
import '../../domain/usecases/get_chat_sessions.dart';
import '../../domain/usecases/send_message.dart';
import 'chat_event.dart';
import 'chat_state.dart';

class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final GetChatSessions getChatSessions;
  final GetChatMessages getChatMessages;
  final SendMessage sendMessage;

  StreamSubscription? _messageSubscription;

  ChatBloc({
    required this.getChatSessions,
    required this.getChatMessages,
    required this.sendMessage,
  }) : super(ChatInitial()) {
    on<LoadChatSessions>(_onLoadChatSessions);
    on<LoadSessionMessages>(_onLoadSessionMessages);
    on<SendChatMessage>(_onSendChatMessage);
    on<ChatMessageChunkReceived>(_onMessageChunkReceived);
    on<ChatStreamError>(_onStreamError);
  }

  Future<void> _onLoadChatSessions(
      LoadChatSessions event, Emitter<ChatState> emit) async {
    emit(ChatLoading());
    final result = await getChatSessions();
    result.fold(
      (failure) => emit(ChatError(failure.message)),
      (sessions) => emit(ChatSessionsLoaded(sessions)),
    );
  }

  Future<void> _onLoadSessionMessages(
      LoadSessionMessages event, Emitter<ChatState> emit) async {
    emit(ChatLoading());
    final result = await getChatMessages(event.sessionId);
    result.fold(
      (failure) => emit(ChatError(failure.message)),
      (messages) => emit(ChatMessagesLoaded(
        messages: messages,
        sessionId: event.sessionId,
      )),
    );
  }

  Future<void> _onSendChatMessage(
      SendChatMessage event, Emitter<ChatState> emit) async {
    final currentState = state;
    List<ChatMessage> currentMessages = [];
    int? sessionId = event.sessionId;

    if (currentState is ChatMessagesLoaded) {
      currentMessages = List.from(currentState.messages);
      sessionId = currentState.sessionId;
    }

    // Add temporary user message
    // Note: In a real app, we might want to wait for the backend to return the actual message object
    // but for immediate UI feedback:
    final tempUserMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch,
      sessionId: sessionId ?? 0,
      role: 'user',
      content: event.message,
      createdAt: DateTime.now().toIso8601String(),
    );

    emit(ChatMessagesLoaded(
      messages: [...currentMessages, tempUserMessage],
      sessionId: sessionId ?? 0,
      isStreaming: true,
      streamingContent: '',
    ));

    // Cancel existing subscription if any
    await _messageSubscription?.cancel();

    // Start listening to chunks
    _messageSubscription = sendMessage.messageStream.listen(
      (chunk) {
        add(ChatMessageChunkReceived(chunk));
      },
      onError: (error) {
        add(ChatStreamError(error.toString()));
      },
      onDone: () {
        // We could send a 'StreamFinished' event here to finalize the message
      },
    );

    final result = await sendMessage(event.message,
        sessionId: sessionId, mode: event.mode);

    result.fold(
      (failure) => emit(ChatError(failure.message)),
      (_) => null, // Message sent successfully, chunks will come through stream
    );
  }

  void _onMessageChunkReceived(
      ChatMessageChunkReceived event, Emitter<ChatState> emit) {
    if (state is ChatMessagesLoaded) {
      final currentState = state as ChatMessagesLoaded;
      emit(currentState.copyWith(
        streamingContent: currentState.streamingContent + event.chunk,
      ));
    }
  }

  void _onStreamError(ChatStreamError event, Emitter<ChatState> emit) {
    emit(ChatError(event.error));
  }

  @override
  Future<void> close() {
    _messageSubscription?.cancel();
    return super.close();
  }
}
