import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../auth/data/models/user_model.dart';
import '../models/organization_model.dart';

class OrganizationRemoteDataSource {
  final ApiClient _apiClient;

  OrganizationRemoteDataSource(this._apiClient);

  Future<List<OrganizationModel>> getOrganizations() async {
    final response = await _apiClient.get(ApiConstants.organization);
    return (response.data as List)
        .map((e) => OrganizationModel.fromJson(e))
        .toList();
  }

  Future<List<UserModel>> getOrgUsers() async {
    final response = await _apiClient.get(ApiConstants.organizationUsers);
    return (response.data as List).map((e) => UserModel.fromJson(e)).toList();
  }

  Future<void> approveUser(int userId) async {
    await _apiClient.post('${ApiConstants.organization}users/$userId/approve');
  }

  Future<void> updateUserRole(int userId, String role) async {
    await _apiClient.put(
      '${ApiConstants.organization}users/$userId/role',
      data: {'user_id': userId, 'role': role},
    );
  }
}
