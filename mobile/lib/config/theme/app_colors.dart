import 'package:flutter/material.dart';

class AppColors {
  // === PRIMARY BRAND COLORS ===
  static const Color primary = Color(0xFFC41E3A);
  static const Color primaryHover = Color(0xFFAA1A33);
  static const Color primaryPressed = Color(0xFF8A1429);
  static const Color primaryLight = Color(0xFFFFF0F3);
  static const Color primarySoft = Color(0xFFFFE0E6);

  // Primary Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFC41E3A), Color(0xFFE8475E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient primaryGradientVertical = LinearGradient(
    colors: [Color(0xFFD92B47), Color(0xFFC41E3A)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // === ACCENT COLORS (Feature-specific) ===
  static const Color accentBlue = Color(0xFF3B82F6);
  static const Color accentBlueSoft = Color(0xFFDBEAFE);
  static const Color accentOrange = Color(0xFFF59E0B);
  static const Color accentOrangeSoft = Color(0xFFFEF3C7);
  static const Color accentTeal = Color(0xFF14B8A6);
  static const Color accentTealSoft = Color(0xFFCCFBF1);
  static const Color accentIndigo = Color(0xFF6366F1);
  static const Color accentIndigoSoft = Color(0xFFE0E7FF);
  static const Color accentPink = Color(0xFFEC4899);
  static const Color accentPinkSoft = Color(0xFFFCE7F3);
  static const Color accentCyan = Color(0xFF06B6D4);
  static const Color accentCyanSoft = Color(0xFFCFFAFE);

  // Feature gradients
  static const LinearGradient chatGradient = LinearGradient(
    colors: [Color(0xFFC41E3A), Color(0xFFE8475E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const LinearGradient validatorGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF60A5FA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const LinearGradient generatorGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const LinearGradient historyGradient = LinearGradient(
    colors: [Color(0xFF14B8A6), Color(0xFF2DD4BF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // === NEUTRAL COLORS (Light Mode) ===
  static const Color background = Color(0xFFFAFAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceElevated = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE5E7EB);
  static const Color borderLight = Color(0xFFF3F4F6);
  static const Color borderHover = Color(0xFFD1D5DB);
  static const Color divider = Color(0xFFF3F4F6);

  // === TEXT COLORS (Light Mode) ===
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color textLink = Color(0xFF3B82F6);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // === SEMANTIC COLORS ===
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color successDark = Color(0xFF059669);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color warningDark = Color(0xFFD97706);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color errorDark = Color(0xFFDC2626);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFFDBEAFE);

  // === DARK MODE ===
  static const Color darkPrimary = Color(0xFFEF4666);
  static const Color darkPrimaryHover = Color(0xFFFF5C7C);
  static const Color darkPrimaryPressed = Color(0xFFDC3550);
  static const Color darkPrimaryLight = Color(0xFF2D1418);
  static const Color darkPrimarySoft = Color(0xFF3D1A20);

  static const LinearGradient darkPrimaryGradient = LinearGradient(
    colors: [Color(0xFFEF4666), Color(0xFFFF6B81)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Color darkBackground = Color(0xFF0F1117);
  static const Color darkSurface = Color(0xFF1A1D27);
  static const Color darkSurfaceElevated = Color(0xFF242837);
  static const Color darkSurfaceBright = Color(0xFF2E3247);
  static const Color darkBorder = Color(0xFF2E3247);
  static const Color darkBorderLight = Color(0xFF1F2233);
  static const Color darkBorderHover = Color(0xFF3D4157);
  static const Color darkDivider = Color(0xFF1F2233);

  static const Color darkTextPrimary = Color(0xFFF9FAFB);
  static const Color darkTextSecondary = Color(0xFF9CA3AF);
  static const Color darkTextTertiary = Color(0xFF6B7280);
  static const Color darkTextLink = Color(0xFF60A5FA);

  // === LEGACY COMPAT (keeping old names working) ===
  static const Color primaryRed = primary;
  static const Color darkPrimaryRed = darkPrimary;
  static const Color darkPrimaryDark = darkPrimaryLight;

  // === UTILITY ===
  static Color shimmer(bool isDark) =>
      isDark ? const Color(0xFF3D4157) : const Color(0xFFE5E7EB);

  static Color overlay(bool isDark) => isDark
      ? Colors.white.withValues(alpha: 0.05)
      : Colors.black.withValues(alpha: 0.03);
}
