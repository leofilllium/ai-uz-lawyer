import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/constants/error_constants.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<Map<String, dynamic>> login(String email, String password);
  Future<Map<String, dynamic>> register(
      String name, String email, String password, int organizationId);
  Future<UserModel> getMe();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient client;

  AuthRemoteDataSourceImpl(this.client);

  @override
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await client.post(ApiConstants.login, data: {
        'email': email,
        'password': password,
      });
      return response.data;
    } on DioException catch (e) {
      throw ServerException(
          e.response?.data['detail'] ?? ErrorConstants.loginFailed);
    }
  }

  @override
  Future<Map<String, dynamic>> register(
      String name, String email, String password, int organizationId) async {
    try {
      final response = await client.post(ApiConstants.register, data: {
        'name': name,
        'email': email,
        'password': password,
        'organization_id': organizationId,
      });
      return response.data;
    } on DioException catch (e) {
      throw ServerException(
          e.response?.data['detail'] ?? ErrorConstants.registrationFailed);
    }
  }

  @override
  Future<UserModel> getMe() async {
    try {
      final response = await client.get(ApiConstants.me);
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw ServerException(
          e.response?.data['detail'] ?? ErrorConstants.failedToGetUser);
    }
  }
}
