class CalendarEvent {
  final int id;
  final String title;
  final String? description;
  final String eventDatetime;
  final int organizationId;
  final int createdBy;
  final String createdAt;
  final String? creatorName;

  const CalendarEvent({
    required this.id,
    required this.title,
    this.description,
    required this.eventDatetime,
    required this.organizationId,
    required this.createdBy,
    required this.createdAt,
    this.creatorName,
  });
}
