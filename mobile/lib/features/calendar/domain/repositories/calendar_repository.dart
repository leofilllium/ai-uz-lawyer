import '../entities/calendar_event.dart';

abstract class CalendarRepository {
  Future<List<CalendarEvent>> getCalendarEvents({int? year, int? month});
  Future<CalendarEvent> createCalendarEvent(Map<String, dynamic> data);
  Future<void> deleteCalendarEvent(int eventId);
}
