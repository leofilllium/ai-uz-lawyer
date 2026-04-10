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
import '../bloc/auth_bloc.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onLoginPressed() {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
            LoginRequested(
              _emailController.text,
              _passwordController.text,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final customColors = context.customColors;

    return Scaffold(
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
                    const SizedBox(height: 60),
                    // Logo
                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: customColors.primaryGradient,
                          borderRadius:
                              BorderRadius.circular(DesignSystem.radiusXl),
                          boxShadow: [
                            BoxShadow(
                              color: colors.primary.withValues(alpha: 0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                              spreadRadius: -2,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.gavel_rounded,
                          color: Colors.white,
                          size: 36,
                        ),
                      ),
                    ),
                    const SizedBox(height: DesignSystem.spacing2xl),
                    // Title
                    Text(
                      context.l10n.welcomeBackTitle,
                      style: AppTextStyles.displayMedium.copyWith(
                        color: colors.onSurface,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: DesignSystem.spacingSm),
                    Text(
                      context.l10n.signInSubtitle,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.7),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: DesignSystem.spacing4xl),
                    // Form Card
                    GlassCard(
                      padding: const EdgeInsets.all(DesignSystem.spacingXl),
                      child: Column(
                        children: [
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
                          const SizedBox(height: DesignSystem.spacingLg),
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
                              return null;
                            },
                          ),
                          const SizedBox(height: DesignSystem.spacingSm),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {},
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: Text(
                                context.l10n.forgotPassword,
                                style: AppTextStyles.label.copyWith(
                                  color: colors.primary,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: DesignSystem.spacingXl),
                          PrimaryButton(
                            text: context.l10n.signIn,
                            onPressed: _onLoginPressed,
                            isLoading: state is AuthLoading,
                            icon: Icons.login_rounded,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: DesignSystem.spacing2xl),
                    // Sign up link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          context.l10n.dontHaveAccount,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: colors.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/register'),
                          child: Text(
                            context.l10n.signUp,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w700,
                              color: colors.primary,
                            ),
                          ),
                        ),
                      ],
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
