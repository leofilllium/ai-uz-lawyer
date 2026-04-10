import '../../../auth/domain/entities/user.dart';
import '../entities/organization.dart';

abstract class OrganizationRepository {
  Future<List<Organization>> getOrganizations();
  Future<List<User>> getOrgUsers();
  Future<void> approveUser(int userId);
  Future<void> updateUserRole(int userId, String role);
}
