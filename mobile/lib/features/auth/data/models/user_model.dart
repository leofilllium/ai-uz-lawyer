import '../../domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.name,
    required super.email,
    super.createdAt,
    super.role,
    super.isApproved,
    super.organizationId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      createdAt: json['created_at'],
      role: json['role'],
      isApproved: json['is_approved'],
      organizationId: json['organization_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'created_at': createdAt,
      'role': role,
      'is_approved': isApproved,
      'organization_id': organizationId,
    };
  }
}
