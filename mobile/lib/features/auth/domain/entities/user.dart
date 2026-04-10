import 'package:equatable/equatable.dart';

class User extends Equatable {
  final int id;
  final String name;
  final String email;
  final String? createdAt;

  final String? role;
  final bool? isApproved;
  final int? organizationId;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.createdAt,
    this.role,
    this.isApproved,
    this.organizationId,
  });

  @override
  List<Object?> get props =>
      [id, name, email, createdAt, role, isApproved, organizationId];
}
