import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/user_model.dart';
import '../../../../core/network/api_handler.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final StorageService storageService;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.storageService,
  });

  @override
  Future<Either<Failure, User>> login(String email, String password) async {
    return ApiHandler.call(() async {
      final data = await remoteDataSource.login(email, password);
      final token = data['token'];
      final userJson = data['user'];

      final user = UserModel.fromJson(userJson);

      await storageService.setToken(token);
      await storageService.saveUser(userJson);

      return user;
    });
  }

  @override
  Future<Either<Failure, User>> register(
      String name, String email, String password, int organizationId) async {
    return ApiHandler.call(() async {
      final data = await remoteDataSource.register(
          name, email, password, organizationId);
      final token = data['token'];
      final userJson = data['user'];

      final user = UserModel.fromJson(userJson);

      await storageService.setToken(token);
      await storageService.saveUser(userJson);

      return user;
    });
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await storageService.removeToken();
      await storageService.removeUser();
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    try {
      // First try cache
      final cachedUser = await storageService.getUser();
      if (cachedUser != null) {
        return Right(UserModel.fromJson(cachedUser));
      }

      // Fallback to API if token exists
      final token = await storageService.getToken();
      if (token != null) {
        final user = await remoteDataSource.getMe();
        await storageService.saveUser(user.toJson());
        return Right(user);
      }

      return const Left(CacheFailure("No user logged in"));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
