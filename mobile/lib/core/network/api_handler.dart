import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import '../../core/error/exceptions.dart';
import '../../core/error/failures.dart';

/// Utility class to handle API call boilerplate.
///
/// Maps exceptions to domain [Failure] types:
/// - [DioException] timeout → [TimeoutFailure]
/// - [DioException] connection → [NetworkFailure]
/// - [DioException] 401/403 → [AuthFailure]
/// - [ServerException] → [ServerFailure] with status code
/// - Everything else → generic [ServerFailure]
class ApiHandler {
  /// Executes [apiCall] and wraps the result in [Either<Failure, T>].
  static Future<Either<Failure, T>> call<T>(
      Future<T> Function() apiCall) async {
    try {
      final result = await apiCall();
      return Right(result);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  static Failure _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutFailure();

      case DioExceptionType.connectionError:
        return const NetworkFailure();

      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final detail = e.response?.data is Map
            ? e.response?.data['detail']
            : e.response?.data?.toString();
        final message = detail ?? 'Server error';

        if (statusCode == 401 || statusCode == 403) {
          return AuthFailure(message.toString());
        }

        return ServerFailure(message.toString(), statusCode: statusCode);

      case DioExceptionType.cancel:
        return const ServerFailure('Request cancelled');

      case DioExceptionType.badCertificate:
        return const ServerFailure('Certificate verification failed');

      case DioExceptionType.unknown:
        if (e.error != null && e.error.toString().contains('SocketException')) {
          return const NetworkFailure();
        }
        return ServerFailure(e.message ?? 'Unknown error');
    }
  }
}
