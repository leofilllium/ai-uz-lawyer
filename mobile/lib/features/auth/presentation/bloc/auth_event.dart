import 'package:equatable/equatable.dart';

/// Base class for all Auth events.
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

/// Dispatched on app startup to check for cached auth state.
class AppStarted extends AuthEvent {}

/// Dispatched when user submits login form.
class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested(this.email, this.password);

  @override
  List<Object> get props => [email, password];
}

/// Dispatched when user submits registration form.
class RegisterRequested extends AuthEvent {
  final String name;
  final String email;
  final String password;
  final int organizationId;

  const RegisterRequested(
      this.name, this.email, this.password, this.organizationId);

  @override
  List<Object> get props => [name, email, password, organizationId];
}

/// Dispatched when user requests logout.
class LogoutRequested extends AuthEvent {}
