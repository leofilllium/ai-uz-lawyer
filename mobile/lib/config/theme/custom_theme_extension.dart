import 'package:flutter/material.dart';

class AppCustomColors extends ThemeExtension<AppCustomColors> {
  final LinearGradient primaryGradient;
  final LinearGradient chatGradient;
  final LinearGradient validatorGradient;
  final LinearGradient generatorGradient;
  final LinearGradient historyGradient;

  final Color shimmerColor;
  final Color overlayColor;

  // App-specific semantic shades not easily mapped to ColorScheme
  final Color successLight;
  final Color successDark;
  final Color warningLight;
  final Color warningDark;
  final Color errorLight;
  final Color errorDark;
  final Color infoLight;

  const AppCustomColors({
    required this.primaryGradient,
    required this.chatGradient,
    required this.validatorGradient,
    required this.generatorGradient,
    required this.historyGradient,
    required this.shimmerColor,
    required this.overlayColor,
    required this.successLight,
    required this.successDark,
    required this.warningLight,
    required this.warningDark,
    required this.errorLight,
    required this.errorDark,
    required this.infoLight,
  });

  @override
  ThemeExtension<AppCustomColors> copyWith({
    LinearGradient? primaryGradient,
    LinearGradient? chatGradient,
    LinearGradient? validatorGradient,
    LinearGradient? generatorGradient,
    LinearGradient? historyGradient,
    Color? shimmerColor,
    Color? overlayColor,
    Color? successLight,
    Color? successDark,
    Color? warningLight,
    Color? warningDark,
    Color? errorLight,
    Color? errorDark,
    Color? infoLight,
  }) {
    return AppCustomColors(
      primaryGradient: primaryGradient ?? this.primaryGradient,
      chatGradient: chatGradient ?? this.chatGradient,
      validatorGradient: validatorGradient ?? this.validatorGradient,
      generatorGradient: generatorGradient ?? this.generatorGradient,
      historyGradient: historyGradient ?? this.historyGradient,
      shimmerColor: shimmerColor ?? this.shimmerColor,
      overlayColor: overlayColor ?? this.overlayColor,
      successLight: successLight ?? this.successLight,
      successDark: successDark ?? this.successDark,
      warningLight: warningLight ?? this.warningLight,
      warningDark: warningDark ?? this.warningDark,
      errorLight: errorLight ?? this.errorLight,
      errorDark: errorDark ?? this.errorDark,
      infoLight: infoLight ?? this.infoLight,
    );
  }

  @override
  ThemeExtension<AppCustomColors> lerp(
      covariant ThemeExtension<AppCustomColors>? other, double t) {
    if (other is! AppCustomColors) {
      return this;
    }
    return AppCustomColors(
      primaryGradient:
          LinearGradient.lerp(primaryGradient, other.primaryGradient, t)!,
      chatGradient: LinearGradient.lerp(chatGradient, other.chatGradient, t)!,
      validatorGradient:
          LinearGradient.lerp(validatorGradient, other.validatorGradient, t)!,
      generatorGradient:
          LinearGradient.lerp(generatorGradient, other.generatorGradient, t)!,
      historyGradient:
          LinearGradient.lerp(historyGradient, other.historyGradient, t)!,
      shimmerColor: Color.lerp(shimmerColor, other.shimmerColor, t)!,
      overlayColor: Color.lerp(overlayColor, other.overlayColor, t)!,
      successLight: Color.lerp(successLight, other.successLight, t)!,
      successDark: Color.lerp(successDark, other.successDark, t)!,
      warningLight: Color.lerp(warningLight, other.warningLight, t)!,
      warningDark: Color.lerp(warningDark, other.warningDark, t)!,
      errorLight: Color.lerp(errorLight, other.errorLight, t)!,
      errorDark: Color.lerp(errorDark, other.errorDark, t)!,
      infoLight: Color.lerp(infoLight, other.infoLight, t)!,
    );
  }
}

extension AppThemeExtension on BuildContext {
  AppCustomColors get customColors =>
      Theme.of(this).extension<AppCustomColors>()!;
  ColorScheme get colors => Theme.of(this).colorScheme;
}
