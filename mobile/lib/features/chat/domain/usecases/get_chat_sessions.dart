import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/chat_session.dart';
import '../repositories/chat_repository.dart';

class GetChatSessions {
  final ChatRepository repository;

  GetChatSessions(this.repository);

  Future<Either<Failure, List<ChatSession>>> call() async {
    return await repository.getSessions();
  }
}
