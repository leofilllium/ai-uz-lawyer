import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/chat_repository.dart';

class SendMessage {
  final ChatRepository repository;

  SendMessage(this.repository);

  Future<Either<Failure, void>> call(String message,
      {int? sessionId, String mode = 'risk-manager'}) async {
    return await repository.sendMessage(message, sessionId, mode);
  }

  Stream<String> get messageStream => repository.messageStream;
}
