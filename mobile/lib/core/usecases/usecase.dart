import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../error/failures.dart';

/// Base class for all use cases in the application.
///
/// [Type] is the return type on success.
/// [Params] is the parameter object (use [NoParams] when none needed).
///
/// Usage:
/// ```dart
/// class GetUser extends UseCase<User, GetUserParams> {
///   @override
///   Future<Either<Failure, User>> call(GetUserParams params) { ... }
/// }
/// ```
abstract class UseCase<T, Params> {
  Future<Either<Failure, T>> call(Params params);
}

/// Use when the use case does not require any parameters.
class NoParams extends Equatable {
  const NoParams();

  @override
  List<Object?> get props => [];
}
