import 'package:equatable/equatable.dart';
import '../../../auth/domain/entities/user.dart';

abstract class OrganizationState extends Equatable {
  const OrganizationState();

  @override
  List<Object?> get props => [];
}

class OrganizationInitial extends OrganizationState {}

class OrganizationLoading extends OrganizationState {}

class OrgUsersLoaded extends OrganizationState {
  final List<User> users;
  const OrgUsersLoaded(this.users);

  @override
  List<Object?> get props => [users];
}

class OrganizationError extends OrganizationState {
  final String message;
  const OrganizationError(this.message);

  @override
  List<Object?> get props => [message];
}

class OrganizationOperationSuccess extends OrganizationState {
  final String message;
  const OrganizationOperationSuccess(this.message);

  @override
  List<Object?> get props => [message];
}
