import '../../../auth/domain/entities/user.dart';
import '../../domain/entities/organization.dart';
import '../../domain/repositories/organization_repository.dart';
import '../datasources/organization_remote_data_source.dart';

class OrganizationRepositoryImpl implements OrganizationRepository {
  final OrganizationRemoteDataSource _remoteDataSource;

  OrganizationRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<Organization>> getOrganizations() async {
    return await _remoteDataSource.getOrganizations();
  }

  @override
  Future<List<User>> getOrgUsers() async {
    return await _remoteDataSource.getOrgUsers();
  }

  @override
  Future<void> approveUser(int userId) async {
    return await _remoteDataSource.approveUser(userId);
  }

  @override
  Future<void> updateUserRole(int userId, String role) async {
    return await _remoteDataSource.updateUserRole(userId, role);
  }
}
