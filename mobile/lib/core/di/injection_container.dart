import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../network/network_info.dart';
import '../network/storage_service.dart';
import '../../features/auth/auth.dart';
import '../../features/chat/chat.dart';
import '../../features/validator/validator.dart';
import '../../features/generator/generator.dart';
import '../../features/history/history.dart';
import '../../features/tasks/tasks.dart';
import '../../features/organization/organization.dart';
import '../../features/calendar/calendar.dart';

/// Global service locator instance.
final sl = GetIt.instance;

/// Initialize all dependency injection modules.
///
/// Call order matters: External → Core → Features.
/// Core services must be registered before feature modules
/// that depend on them.
Future<void> init() async {
  //──────────────────────────────────────────────
  // External
  //──────────────────────────────────────────────
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPreferences);

  //──────────────────────────────────────────────
  // Core
  //──────────────────────────────────────────────
  sl.registerLazySingleton<StorageService>(() => StorageServiceImpl(sl()));
  sl.registerLazySingleton<ApiClient>(() => ApiClient(sl()));
  sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl());

  //──────────────────────────────────────────────
  // Features
  //──────────────────────────────────────────────
  initAuthModule(sl);
  initChatModule(sl);
  initValidatorModule(sl);
  initGeneratorModule(sl);
  initHistoryModule(sl);
  initTasksModule(sl);
  initOrganizationModule(sl);
  initCalendarModule(sl);
}
