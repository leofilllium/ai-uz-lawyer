import '../../domain/entities/calendar_event.dart';

class CalendarEventModel extends CalendarEvent {
  const CalendarEventModel({
    required super.id,
    required super.title,
    super.description,
    required super.eventDatetime,
    required super.organizationId,
    required super.createdBy,
    required super.createdAt,
    super.creatorName,
  });

  factory CalendarEventModel.fromJson(Map<String, dynamic> json) {
    return CalendarEventModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      eventDatetime: json['event_datetime'],
      organizationId: json['organization_id'],
      createdBy: json['created_by'],
      createdAt: json['created_at'],
      creatorName: json['creator_name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'event_datetime': eventDatetime,
      'organization_id': organizationId,
      'created_by': createdBy,
      'created_at': createdAt,
      'creator_name': creatorName,
    };
  }
}
