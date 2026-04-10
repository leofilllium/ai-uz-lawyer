import '../../domain/entities/calendar_event.dart';
import '../../domain/repositories/calendar_repository.dart';
import '../datasources/calendar_remote_data_source.dart';

class CalendarRepositoryImpl implements CalendarRepository {
  final CalendarRemoteDataSource _remoteDataSource;

  CalendarRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<CalendarEvent>> getCalendarEvents({int? year, int? month}) async {
    return await _remoteDataSource.getCalendarEvents(year: year, month: month);
  }

  @override
  Future<CalendarEvent> createCalendarEvent(Map<String, dynamic> data) async {
    return await _remoteDataSource.createCalendarEvent(data);
  }

  @override
  Future<void> deleteCalendarEvent(int eventId) async {
    return await _remoteDataSource.deleteCalendarEvent(eventId);
  }
}
