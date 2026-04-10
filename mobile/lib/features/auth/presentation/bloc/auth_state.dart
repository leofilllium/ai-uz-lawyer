import 'package:equatable/equatable.dart';
import '../../domain/entities/user.dart';

/// Base class for all Auth states.
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object> get props => [];
}

/// Initial state before any auth check.
class AuthInitial extends AuthState {}

/// Auth check or login/register in progress.
class AuthLoading extends AuthState {}

/// User is authenticated.
class AuthAuthenticated extends AuthState {
  final User user;

  const AuthAuthenticated(this.user);

  @override
  List<Object> get props => [user];
}

/// User is not authenticated (no cached token or session expired).
class AuthUnauthenticated extends AuthState {}

/// Auth operation failed with an error message.
class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object> get props => [message];
}
