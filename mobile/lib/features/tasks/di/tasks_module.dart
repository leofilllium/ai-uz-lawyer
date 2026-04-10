import 'package:get_it/get_it.dart';
import '../data/datasources/tasks_remote_data_source.dart';
import '../data/repositories/tasks_repository_impl.dart';
import '../domain/repositories/tasks_repository.dart';
import '../presentation/bloc/tasks_bloc.dart';

void initTasksModule(GetIt sl) {
  // BLoC — Factory for fresh instance per screen
  sl.registerFactory(
    () => TasksBloc(sl()),
  );

  // Repository
  sl.registerLazySingleton<TasksRepository>(
    () => TasksRepositoryImpl(sl()),
  );

  // Data sources
  sl.registerLazySingleton(
    () => TasksRemoteDataSource(sl()),
  );
}
