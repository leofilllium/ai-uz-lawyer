import 'package:dio/dio.dart';
import 'dart:developer' as developer;

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log(
      '---> ${options.method.toUpperCase()} ${options.baseUrl}${options.path}',
      name: 'NETWORK',
    );
    developer.log('Headers: ${options.headers}', name: 'NETWORK');
    if (options.data != null) {
      developer.log('Body: ${options.data}', name: 'NETWORK');
    }
    developer.log('---> END ${options.method.toUpperCase()}', name: 'NETWORK');
    return super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '<--- ${response.statusCode} ${response.requestOptions.method.toUpperCase()} ${response.requestOptions.baseUrl}${response.requestOptions.path}',
      name: 'NETWORK',
    );
    developer.log('Headers: ${response.headers}', name: 'NETWORK');
    developer.log('Response: ${response.data}', name: 'NETWORK');
    developer.log('<--- END HTTP', name: 'NETWORK');
    return super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      'X--- ${err.response?.statusCode ?? 'ERROR'} ${err.requestOptions.method.toUpperCase()} ${err.requestOptions.baseUrl}${err.requestOptions.path}',
      name: 'NETWORK',
      error: err,
    );
    if (err.response?.data != null) {
      developer.log('Response data: ${err.response?.data}', name: 'NETWORK');
    }
    developer.log('X--- END HTTP', name: 'NETWORK');
    return super.onError(err, handler);
  }
}
