import 'package:get_it/get_it.dart';
import '../data/datasources/calendar_remote_data_source.dart';
import '../data/repositories/calendar_repository_impl.dart';
import '../domain/repositories/calendar_repository.dart';
import '../presentation/bloc/calendar_bloc.dart';

void initCalendarModule(GetIt sl) {
  // BLoC — Factory for fresh instance per screen
  sl.registerFactory(
    () => CalendarBloc(sl()),
  );

  // Repository
  sl.registerLazySingleton<CalendarRepository>(
    () => CalendarRepositoryImpl(sl()),
  );

  // Data sources
  sl.registerLazySingleton(
    () => CalendarRemoteDataSource(sl()),
  );
}
