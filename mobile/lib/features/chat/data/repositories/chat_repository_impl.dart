import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/api_handler.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/chat_session.dart';
import '../../domain/repositories/chat_repository.dart';
import '../datasources/chat_remote_data_source.dart';

class ChatRepositoryImpl implements ChatRepository {
  final ChatRemoteDataSource remoteDataSource;

  ChatRepositoryImpl({required this.remoteDataSource});

  @override
  Stream<String> get messageStream => remoteDataSource.messageStream;

  @override
  Future<Either<Failure, List<ChatMessage>>> getSessionMessages(
      int sessionId) async {
    return ApiHandler.call(
        () => remoteDataSource.getSessionMessages(sessionId));
  }

  @override
  Future<Either<Failure, List<ChatSession>>> getSessions() async {
    return ApiHandler.call(() => remoteDataSource.getSessions());
  }

  @override
  Future<Either<Failure, void>> sendMessage(
      String message, int? sessionId, String mode) async {
    return ApiHandler.call(() async {
      await remoteDataSource.sendMessage(message, sessionId, mode);
    });
  }
}
