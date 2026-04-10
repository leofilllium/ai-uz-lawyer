import 'package:get_it/get_it.dart';
import '../data/datasources/chat_remote_data_source.dart';
import '../data/repositories/chat_repository_impl.dart';
import '../domain/repositories/chat_repository.dart';
import '../domain/usecases/get_chat_messages.dart';
import '../domain/usecases/get_chat_sessions.dart';
import '../domain/usecases/send_message.dart';
import '../presentation/bloc/chat_bloc.dart';

void initChatModule(GetIt sl) {
  // BLoC — Factory for fresh instance per screen
  sl.registerFactory(
    () => ChatBloc(
      getChatSessions: sl(),
      getChatMessages: sl(),
      sendMessage: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => GetChatSessions(sl()));
  sl.registerLazySingleton(() => GetChatMessages(sl()));
  sl.registerLazySingleton(() => SendMessage(sl()));

  // Repository
  sl.registerLazySingleton<ChatRepository>(
    () => ChatRepositoryImpl(remoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<ChatRemoteDataSource>(
    () => ChatRemoteDataSourceImpl(sl()),
  );
}
