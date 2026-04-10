/// Base exception for server/API errors.
///
/// Carries optional [statusCode] and response [data] for
/// richer error context when mapping to domain failures.
class ServerException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ServerException(this.message, {this.statusCode, this.data});

  @override
  String toString() => 'ServerException($statusCode): $message';
}

/// Exception for local cache/storage errors.
class CacheException implements Exception {
  final String message;
  CacheException(this.message);

  @override
  String toString() => 'CacheException: $message';
}

/// Exception for network connectivity issues.
class NetworkException implements Exception {
  final String message;
  NetworkException([this.message = 'No internet connection']);

  @override
  String toString() => 'NetworkException: $message';
}
