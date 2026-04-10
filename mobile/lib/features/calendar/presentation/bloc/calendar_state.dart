import 'package:equatable/equatable.dart';
import '../../domain/entities/calendar_event.dart';

abstract class CalendarState extends Equatable {
  const CalendarState();

  @override
  List<Object?> get props => [];
}

class CalendarInitial extends CalendarState {}

class CalendarLoading extends CalendarState {}

class CalendarLoaded extends CalendarState {
  final List<CalendarEvent> events;

  const CalendarLoaded(this.events);

  @override
  List<Object?> get props => [events];
}

class CalendarError extends CalendarState {
  final String message;

  const CalendarError(this.message);

  @override
  List<Object?> get props => [message];
}

class CalendarOperationSuccess extends CalendarState {
  final String message;

  const CalendarOperationSuccess(this.message);

  @override
  List<Object?> get props => [message];
}
