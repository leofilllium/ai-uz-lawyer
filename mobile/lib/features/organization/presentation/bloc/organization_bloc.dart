import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/organization_repository.dart';
import 'organization_event.dart';
import 'organization_state.dart';

class OrganizationBloc extends Bloc<OrganizationEvent, OrganizationState> {
  final OrganizationRepository _organizationRepository;

  OrganizationBloc(this._organizationRepository)
      : super(OrganizationInitial()) {
    on<LoadOrgUsersEvent>(_onLoadOrgUsers);
    on<ApproveUserEvent>(_onApproveUser);
    on<UpdateUserRoleEvent>(_onUpdateUserRole);
  }

  Future<void> _onLoadOrgUsers(
      LoadOrgUsersEvent event, Emitter<OrganizationState> emit) async {
    emit(OrganizationLoading());
    try {
      final users = await _organizationRepository.getOrgUsers();
      emit(OrgUsersLoaded(users));
    } catch (e) {
      emit(OrganizationError(e.toString()));
    }
  }

  Future<void> _onApproveUser(
      ApproveUserEvent event, Emitter<OrganizationState> emit) async {
    emit(OrganizationLoading());
    try {
      await _organizationRepository.approveUser(event.userId);
      emit(const OrganizationOperationSuccess('User approved successfully'));
      add(LoadOrgUsersEvent());
    } catch (e) {
      emit(OrganizationError(e.toString()));
    }
  }

  Future<void> _onUpdateUserRole(
      UpdateUserRoleEvent event, Emitter<OrganizationState> emit) async {
    emit(OrganizationLoading());
    try {
      await _organizationRepository.updateUserRole(event.userId, event.role);
      emit(const OrganizationOperationSuccess('User role updated'));
      add(LoadOrgUsersEvent());
    } catch (e) {
      emit(OrganizationError(e.toString()));
    }
  }
}
