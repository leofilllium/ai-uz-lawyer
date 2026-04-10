import 'package:equatable/equatable.dart';

abstract class CalendarEventBase extends Equatable {
  const CalendarEventBase();

  @override
  List<Object?> get props => [];
}

class LoadCalendarEvents extends CalendarEventBase {
  final int? year;
  final int? month;

  const LoadCalendarEvents({this.year, this.month});

  @override
  List<Object?> get props => [year, month];
}

class CreateCalendarEvent extends CalendarEventBase {
  final Map<String, dynamic> eventData;

  const CreateCalendarEvent(this.eventData);

  @override
  List<Object?> get props => [eventData];
}

class DeleteCalendarEvent extends CalendarEventBase {
  final int eventId;

  const DeleteCalendarEvent(this.eventId);

  @override
  List<Object?> get props => [eventId];
}
