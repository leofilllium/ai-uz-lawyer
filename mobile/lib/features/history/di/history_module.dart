import 'package:get_it/get_it.dart';
import '../data/datasources/history_remote_data_source.dart';
import '../data/repositories/history_repository_impl.dart';
import '../domain/repositories/history_repository.dart';
import '../domain/usecases/get_history.dart';
import '../domain/usecases/delete_history_item.dart';
import '../presentation/bloc/history_bloc.dart';

void initHistoryModule(GetIt sl) {
  // Bloc
  sl.registerFactory(
    () => HistoryBloc(
      getHistory: sl(),
      deleteHistoryItem: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => GetHistory(sl()));
  sl.registerLazySingleton(() => DeleteHistoryItem(sl()));

  // Repository
  sl.registerLazySingleton<HistoryRepository>(
    () => HistoryRepositoryImpl(remoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<HistoryRemoteDataSource>(
    () => HistoryRemoteDataSourceImpl(apiClient: sl()),
  );
}
