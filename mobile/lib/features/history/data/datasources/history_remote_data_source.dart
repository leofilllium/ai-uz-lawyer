import '../../../../core/network/api_client.dart';
import '../../../../core/error/exceptions.dart';
import '../models/history_item_model.dart';

abstract class HistoryRemoteDataSource {
  Future<List<HistoryItemModel>> getHistory(
      {String? type, int skip = 0, int limit = 50});
  Future<void> deleteHistoryItem({required String type, required int id});
}

class HistoryRemoteDataSourceImpl implements HistoryRemoteDataSource {
  final ApiClient apiClient;

  HistoryRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<HistoryItemModel>> getHistory(
      {String? type, int skip = 0, int limit = 50}) async {
    final queryParams = {
      if (type != null) 'type': type,
      'skip': skip.toString(),
      'limit': limit.toString(),
    };

    final uri = Uri(path: '/api/history', queryParameters: queryParams);
    final response = await apiClient.get(uri.toString());

    if (response.statusCode == 200) {
      final List<dynamic> jsonList = response.data;
      return jsonList.map((json) => HistoryItemModel.fromJson(json)).toList();
    } else {
      throw ServerException('Failed to load history');
    }
  }

  @override
  Future<void> deleteHistoryItem(
      {required String type, required int id}) async {
    final response = await apiClient.delete('/api/history/$type/$id');

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw ServerException('Failed to delete history item');
    }
  }
}
