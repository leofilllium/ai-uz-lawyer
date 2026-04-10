import 'package:get_it/get_it.dart';
import '../data/datasources/validator_remote_data_source.dart';
import '../data/repositories/validator_repository_impl.dart';
import '../domain/repositories/validator_repository.dart';
import '../domain/usecases/analyze_contract.dart';
import '../domain/usecases/get_validation_history.dart';
import '../presentation/bloc/validator_bloc.dart';

void initValidatorModule(GetIt sl) {
  // BLoC — Factory for fresh instance per screen
  sl.registerFactory(
    () => ValidatorBloc(
      analyzeContract: sl(),
      getValidationHistory: sl(),
    ),
  );

  // Use cases
  sl.registerLazySingleton(() => AnalyzeContract(sl()));
  sl.registerLazySingleton(() => GetValidationHistory(sl()));

  // Repository
  sl.registerLazySingleton<ValidatorRepository>(
    () => ValidatorRepositoryImpl(remoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<ValidatorRemoteDataSource>(
    () => ValidatorRemoteDataSourceImpl(sl()),
  );
}
