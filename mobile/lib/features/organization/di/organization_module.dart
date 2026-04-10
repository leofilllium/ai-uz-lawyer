import 'package:get_it/get_it.dart';
import '../data/datasources/organization_remote_data_source.dart';
import '../data/repositories/organization_repository_impl.dart';
import '../domain/repositories/organization_repository.dart';
import '../presentation/bloc/organization_bloc.dart';

void initOrganizationModule(GetIt sl) {
  // BLoC — Factory for fresh instance per screen
  sl.registerFactory(
    () => OrganizationBloc(sl()),
  );

  // Repository
  sl.registerLazySingleton<OrganizationRepository>(
    () => OrganizationRepositoryImpl(sl()),
  );

  // Data sources
  sl.registerLazySingleton(
    () => OrganizationRemoteDataSource(sl()),
  );
}
