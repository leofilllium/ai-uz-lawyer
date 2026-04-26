import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/di/injection_container.dart';
import '../../features/home/home.dart';
import '../../features/auth/auth.dart';
import '../../features/chat/chat.dart';
import '../../features/validator/validator.dart';
import '../../features/generator/generator.dart';
import '../../features/history/history.dart';
import '../../features/tasks/tasks.dart';
import '../../features/organization/organization.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    refreshListenable: GoRouterRefreshStream(sl<AuthBloc>().stream),
    redirect: (context, state) {
      final authState = sl<AuthBloc>().state;
      final bool isLoggedIn = authState is AuthAuthenticated;
      final bool isLoggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }
      if (isLoggedIn && isLoggingIn) {
        return '/';
      }
      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) {
          return MultiBlocProvider(
            providers: [
              BlocProvider<AuthBloc>(
                create: (context) => sl<AuthBloc>()..add(AppStarted()),
              ),
              BlocProvider<ChatBloc>(
                create: (context) => sl<ChatBloc>()..add(LoadChatSessions()),
              ),
              BlocProvider<ValidatorBloc>(
                create: (context) =>
                    sl<ValidatorBloc>()..add(LoadValidationHistory()),
              ),
              BlocProvider<GeneratorBloc>(
                create: (context) => sl<GeneratorBloc>()
                  ..add(LoadCategories())
                  ..add(LoadGeneratorHistory()),
              ),
              BlocProvider<HistoryBloc>(
                create: (context) =>
                    sl<HistoryBloc>()..add(const LoadHistory()),
              ),
              BlocProvider<TasksBloc>(
                create: (context) => sl<TasksBloc>()..add(LoadTasksEvent()),
              ),
              BlocProvider<OrganizationBloc>(
                create: (context) => sl<OrganizationBloc>(),
              ),
            ],
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const MainNavigationPage(),
          ),
          GoRoute(
            path: '/login',
            builder: (context, state) => const LoginPage(),
          ),
          GoRoute(
            path: '/register',
            builder: (context, state) => const RegisterPage(),
          ),
        ],
      ),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
          (dynamic _) => notifyListeners(),
        );
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
