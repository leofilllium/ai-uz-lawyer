import 'package:get_it/get_it.dart';
import '../data/datasources/generator_remote_data_source.dart';
import '../data/repositories/generator_repository_impl.dart';
import '../domain/repositories/generator_repository.dart';
import '../domain/usecases/generator_usecases.dart';
import '../domain/usecases/get_generator_history.dart';
import '../presentation/bloc/generator_bloc.dart';

void initGeneratorModule(GetIt sl) {
  // BLoC — Factory for fresh instance per screen
  sl.registerFactory(
    () => GeneratorBloc(
      getCategories: sl(),
      generateContract: sl(),
      getGeneratorHistory: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => GetCategories(sl()));
  sl.registerLazySingleton(() => GenerateContract(sl()));
  sl.registerLazySingleton(() => GetGeneratorHistory(sl()));

  // Repository
  sl.registerLazySingleton<GeneratorRepository>(
    () => GeneratorRepositoryImpl(remoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<GeneratorRemoteDataSource>(
    () => GeneratorRemoteDataSourceImpl(sl()),
  );
}
