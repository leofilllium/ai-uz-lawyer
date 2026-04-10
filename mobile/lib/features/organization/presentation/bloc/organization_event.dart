import 'package:equatable/equatable.dart';

abstract class OrganizationEvent extends Equatable {
  const OrganizationEvent();

  @override
  List<Object?> get props => [];
}

class LoadOrgUsersEvent extends OrganizationEvent {}

class ApproveUserEvent extends OrganizationEvent {
  final int userId;
  const ApproveUserEvent(this.userId);

  @override
  List<Object?> get props => [userId];
}

class UpdateUserRoleEvent extends OrganizationEvent {
  final int userId;
  final String role;
  const UpdateUserRoleEvent(this.userId, this.role);

  @override
  List<Object?> get props => [userId, role];
}
