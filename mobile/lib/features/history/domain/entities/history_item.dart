class HistoryItem {
  final int id;
  final String type;
  final String title;
  final String preview;
  final String createdAt;
  final String updatedAt;
  final String icon;
  final Map<String, dynamic> metadata;

  const HistoryItem({
    required this.id,
    required this.type,
    required this.title,
    required this.preview,
    required this.createdAt,
    required this.updatedAt,
    required this.icon,
    required this.metadata,
  });
}
