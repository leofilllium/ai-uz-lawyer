import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../config/theme/custom_theme_extension.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../core/network/api_client.dart';
import '../../../organization/data/datasources/organization_remote_data_source.dart';
import '../../../organization/data/models/organization_model.dart';
import '../bloc/auth_bloc.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isLoadingOrgs = true;
  List<OrganizationModel> _organizations = [];
  int? _selectedOrganizationId;
  String? _orgError;

  @override
  void initState() {
    super.initState();
    _loadOrganizations();
  }

  Future<void> _loadOrganizations() async {
    try {
      final apiClient = context.read<ApiClient>();
      final remoteDataSource = OrganizationRemoteDataSource(apiClient);
      final orgs = await remoteDataSource.getOrganizations();

      setState(() {
        _organizations = orgs;
        if (orgs.isNotEmpty) {
          _selectedOrganizationId = orgs.first.id;
        }
        _isLoadingOrgs = false;
      });
    } catch (e) {
      setState(() {
        _orgError = 'Failed to load organizations';
        _isLoadingOrgs = false;
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onRegisterPressed() {
    if (_formKey.currentState!.validate()) {
      if (_selectedOrganizationId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Пожалуйста, выберите организацию')),
        );
        return;
      }
      context.read<AuthBloc>().add(
            RegisterRequested(
              _nameController.text,
              _emailController.text,
              _passwordController.text,
              _selectedOrganizationId!,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
              border: Border.all(
                color: colors.outline,
              ),
            ),
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 16,
              color: colors.onSurface,
            ),
          ),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            context.go('/');
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: DesignSystem.spacingXl,
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: DesignSystem.spacingBase),
                    // Header
                    Text(
                      context.l10n.joinAiLawyer,
                      style: AppTextStyles.displayMedium.copyWith(
                        color: colors.onSurface,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: DesignSystem.spacingSm),
                    Text(
                      context.l10n.getExpertGuidance,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.7),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: DesignSystem.spacing2xl),
                    // Form Card
                    GlassCard(
                      padding: const EdgeInsets.all(DesignSystem.spacingXl),
                      child: Column(
                        children: [
                          CustomTextField(
                            label: context.l10n.fullName,
                            hint: 'John Doe',
                            controller: _nameController,
                            prefixIcon: Icon(
                              Icons.person_outline_rounded,
                              size: 20,
                              color: colors.onSurface.withValues(alpha: 0.5),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return context.l10n.pleaseEnterName;
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: DesignSystem.spacingBase),
                          CustomTextField(
                            label: context.l10n.email,
                            hint: 'example@mail.com',
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            prefixIcon: Icon(
                              Icons.email_outlined,
                              size: 20,
                              color: colors.onSurface.withValues(alpha: 0.5),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return context.l10n.pleaseEnterEmail;
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: DesignSystem.spacingBase),
                          // Organization Dropdown
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Организация',
                                style: AppTextStyles.label.copyWith(
                                  color:
                                      colors.onSurface.withValues(alpha: 0.7),
                                ),
                              ),
                              const SizedBox(height: 8),
                              if (_isLoadingOrgs)
                                Container(
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: colors.surfaceContainerHighest,
                                    borderRadius: BorderRadius.circular(
                                        DesignSystem.inputRadius),
                                  ),
                                  child: const Center(
                                    child: SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2),
                                    ),
                                  ),
                                )
                              else if (_orgError != null)
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.errorLight,
                                    borderRadius: BorderRadius.circular(
                                        DesignSystem.inputRadius),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.error_outline,
                                          color: AppColors.error, size: 18),
                                      const SizedBox(width: 8),
                                      Text(_orgError!,
                                          style: AppTextStyles.bodySmall
                                              .copyWith(
                                                  color: AppColors.error)),
                                    ],
                                  ),
                                )
                              else
                                DropdownButtonFormField<int>(
                                  initialValue: _selectedOrganizationId,
                                  decoration: InputDecoration(
                                    prefixIcon: Icon(
                                      Icons.business_outlined,
                                      size: 20,
                                      color: colors.onSurface
                                          .withValues(alpha: 0.5),
                                    ),
                                  ),
                                  items: _organizations.map((org) {
                                    return DropdownMenuItem(
                                      value: org.id,
                                      child: Text(org.name),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    setState(() {
                                      _selectedOrganizationId = val;
                                    });
                                  },
                                  validator: (value) {
                                    if (value == null) {
                                      return 'Пожалуйста, выберите организацию';
                                    }
                                    return null;
                                  },
                                ),
                            ],
                          ),
                          const SizedBox(height: DesignSystem.spacingBase),
                          CustomTextField(
                            label: context.l10n.password,
                            hint:
                                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
                            controller: _passwordController,
                            obscureText: true,
                            prefixIcon: Icon(
                              Icons.lock_outline_rounded,
                              size: 20,
                              color: colors.onSurface.withValues(alpha: 0.5),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return context.l10n.pleaseEnterPassword;
                              }
                              if (value.length < 6) {
                                return context.l10n.passwordShort;
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: DesignSystem.spacingXl),
                          PrimaryButton(
                            text: context.l10n.createAccount,
                            onPressed: _onRegisterPressed,
                            isLoading: state is AuthLoading,
                            icon: Icons.person_add_alt_1_rounded,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: DesignSystem.spacingXl),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          context.l10n.alreadyHaveAccount,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: colors.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/login'),
                          child: Text(
                            context.l10n.signIn,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w700,
                              color: colors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: DesignSystem.spacingBase),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: DesignSystem.spacingXl),
                      child: Text(
                        context.l10n.termsPolicy,
                        style: AppTextStyles.caption.copyWith(
                          color: colors.onSurface.withValues(alpha: 0.5),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: DesignSystem.spacing2xl),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
