import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/calendar_repository.dart';
import 'calendar_event.dart';
import 'calendar_state.dart';

class CalendarBloc extends Bloc<CalendarEventBase, CalendarState> {
  final CalendarRepository _calendarRepository;

  CalendarBloc(this._calendarRepository) : super(CalendarInitial()) {
    on<LoadCalendarEvents>(_onLoadCalendarEvents);
    on<CreateCalendarEvent>(_onCreateCalendarEvent);
    on<DeleteCalendarEvent>(_onDeleteCalendarEvent);
  }

  Future<void> _onLoadCalendarEvents(
      LoadCalendarEvents event, Emitter<CalendarState> emit) async {
    emit(CalendarLoading());
    try {
      final events = await _calendarRepository.getCalendarEvents(
          year: event.year, month: event.month);
      emit(CalendarLoaded(events));
    } catch (e) {
      emit(CalendarError(e.toString()));
    }
  }

  Future<void> _onCreateCalendarEvent(
      CreateCalendarEvent event, Emitter<CalendarState> emit) async {
    emit(CalendarLoading());
    try {
      await _calendarRepository.createCalendarEvent(event.eventData);
      emit(const CalendarOperationSuccess('Event created successfully'));
      // Reload events for current month (could be improved to store current date in state)
      add(const LoadCalendarEvents());
    } catch (e) {
      emit(CalendarError(e.toString()));
    }
  }

  Future<void> _onDeleteCalendarEvent(
      DeleteCalendarEvent event, Emitter<CalendarState> emit) async {
    emit(CalendarLoading());
    try {
      await _calendarRepository.deleteCalendarEvent(event.eventId);
      emit(const CalendarOperationSuccess('Event deleted'));
      add(const LoadCalendarEvents());
    } catch (e) {
      emit(CalendarError(e.toString()));
    }
  }
}
