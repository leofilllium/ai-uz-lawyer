import 'package:equatable/equatable.dart';

/// Base class for all domain-level failures.
///
/// Failures represent expected error conditions that should be
/// handled gracefully by the presentation layer.
abstract class Failure extends Equatable {
  final String message;
  final int? statusCode;

  const Failure(this.message, {this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];
}

/// Failure originating from a remote API call.
class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.statusCode});
}

/// Failure originating from local cache/storage operations.
class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

/// Failure due to missing or lost network connectivity.
class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'No internet connection']);
}

/// Failure due to an API request timing out.
class TimeoutFailure extends Failure {
  const TimeoutFailure([super.message = 'Request timed out']);
}

/// Failure due to authentication issues (401/403).
class AuthFailure extends Failure {
  const AuthFailure([super.message = 'Authentication failed'])
      : super(statusCode: 401);
}

/// Failure due to input validation errors.
class ValidationFailure extends Failure {
  final Map<String, List<String>>? fieldErrors;

  const ValidationFailure(
    super.message, {
    this.fieldErrors,
  }) : super(statusCode: 422);

  @override
  List<Object?> get props => [message, statusCode, fieldErrors];
}
