import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/chat_message_model.dart';
import '../models/chat_session_model.dart';

abstract class ChatRemoteDataSource {
  Future<List<ChatSessionModel>> getSessions();
  Future<List<ChatMessageModel>> getSessionMessages(int sessionId);
  Future<void> sendMessage(String message, int? sessionId, String mode);
  Stream<String> get messageStream;
}

class ChatRemoteDataSourceImpl implements ChatRemoteDataSource {
  final ApiClient apiClient;
  final StreamController<String> _messageController =
      StreamController<String>.broadcast();

  ChatRemoteDataSourceImpl(this.apiClient);

  @override
  Stream<String> get messageStream => _messageController.stream;

  @override
  Future<List<ChatSessionModel>> getSessions() async {
    final response = await apiClient.get(ApiConstants.lawyerSessions);
    return (response.data as List)
        .map((e) => ChatSessionModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<ChatMessageModel>> getSessionMessages(int sessionId) async {
    final response =
        await apiClient.get('${ApiConstants.lawyerSessions}/$sessionId');
    final messages = response.data['messages'] as List;
    return messages.map((e) => ChatMessageModel.fromJson(e)).toList();
  }

  @override
  Future<void> sendMessage(String message, int? sessionId, String mode) async {
    try {
      final response = await apiClient.dio.post(
        ApiConstants.lawyerChat,
        data: {
          'message': message,
          'session_id': sessionId,
          'chat_mode': mode,
        },
        options: Options(responseType: ResponseType.stream),
      );

      final stream = response.data.stream as Stream<List<int>>;

      stream.transform(utf8.decoder).transform(const LineSplitter()).listen(
        (line) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6);
            if (data.trim().isEmpty) return;

            try {
              final json = jsonDecode(data);
              if (json['chunk'] != null) {
                _messageController.add(json['chunk']);
              } else if (json['done'] == true) {
                // Signal completion if needed or just wait for stream to close
              } else if (json['error'] != null) {
                _messageController.addError(json['error']);
              }
            } catch (e) {
              // Ignore partial JSON or other malformed lines
            }
          }
        },
        onError: (e) {
          _messageController.addError(e);
        },
        onDone: () {
          // Stream completed
        },
        cancelOnError: true,
      );
    } catch (e) {
      rethrow;
    }
  }
}
