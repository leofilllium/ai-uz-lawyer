import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/chat_message.dart';
import '../repositories/chat_repository.dart';

class GetChatMessages {
  final ChatRepository repository;

  GetChatMessages(this.repository);

  Future<Either<Failure, List<ChatMessage>>> call(int sessionId) async {
    return await repository.getSessionMessages(sessionId);
  }
}
