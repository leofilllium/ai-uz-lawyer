import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/calendar_event_model.dart';

class CalendarRemoteDataSource {
  final ApiClient _apiClient;

  CalendarRemoteDataSource(this._apiClient);

  Future<List<CalendarEventModel>> getCalendarEvents(
      {int? year, int? month}) async {
    final Map<String, dynamic> queryParams = {};
    if (year != null) queryParams['year'] = year;
    if (month != null) queryParams['month'] = month;

    final response = await _apiClient.get(ApiConstants.calendar,
        queryParameters: queryParams);
    return (response.data as List)
        .map((e) => CalendarEventModel.fromJson(e))
        .toList();
  }

  Future<CalendarEventModel> createCalendarEvent(
      Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiConstants.calendar, data: data);
    return CalendarEventModel.fromJson(response.data);
  }

  Future<void> deleteCalendarEvent(int eventId) async {
    await _apiClient.delete('${ApiConstants.calendar}$eventId');
  }
}
