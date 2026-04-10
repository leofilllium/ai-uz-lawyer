import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/chat_message.dart';
import '../entities/chat_session.dart';

abstract class ChatRepository {
  Future<Either<Failure, List<ChatSession>>> getSessions();
  Future<Either<Failure, List<ChatMessage>>> getSessionMessages(int sessionId);
  Future<Either<Failure, void>> sendMessage(
      String message, int? sessionId, String mode);
  Stream<String> get messageStream; // For SSE chunks
}
