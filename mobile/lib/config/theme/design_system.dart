import 'package:flutter/material.dart';

class DesignSystem {
  // === SPACING SCALE ===
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 12.0;
  static const double spacingBase = 16.0;
  static const double spacingLg = 20.0;
  static const double spacingXl = 24.0;
  static const double spacing2xl = 32.0;
  static const double spacing3xl = 40.0;
  static const double spacing4xl = 48.0;
  static const double spacing5xl = 64.0;

  // === LAYOUT ===
  static const double horizontalMarginMobile = 20.0;
  static const double horizontalMarginTablet = 24.0;
  static const double gutterWidth = 16.0;
  static const double minSafePadding = 20.0;

  // === BORDER RADIUS ===
  static const double radiusXs = 6.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 20.0;
  static const double radius2xl = 24.0;
  static const double radiusFull = 999.0;

  // Component-specific (convenience aliases)
  static const double cardRadius = radiusLg;
  static const double buttonRadius = radiusMd;
  static const double inputRadius = radiusMd;
  static const double chipRadius = radiusFull;

  // === SHADOWS ===
  static List<BoxShadow> get shadowSm => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          offset: const Offset(0, 1),
          blurRadius: 3,
          spreadRadius: 0,
        ),
      ];

  static List<BoxShadow> get shadowMd => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.06),
          offset: const Offset(0, 4),
          blurRadius: 12,
          spreadRadius: -2,
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          offset: const Offset(0, 2),
          blurRadius: 4,
          spreadRadius: -1,
        ),
      ];

  static List<BoxShadow> get shadowLg => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          offset: const Offset(0, 8),
          blurRadius: 24,
          spreadRadius: -4,
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          offset: const Offset(0, 4),
          blurRadius: 8,
          spreadRadius: -2,
        ),
      ];

  static List<BoxShadow> shadowColor(Color color) => [
        BoxShadow(
          color: color.withValues(alpha: 0.25),
          offset: const Offset(0, 4),
          blurRadius: 16,
          spreadRadius: -2,
        ),
      ];

  static List<BoxShadow> get darkShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.3),
          offset: const Offset(0, 4),
          blurRadius: 12,
          spreadRadius: -2,
        ),
      ];

  // Legacy alias
  static List<BoxShadow> get lightShadow => shadowMd;

  // === ANIMATION ===
  static const Duration animFast = Duration(milliseconds: 150);
  static const Duration animNormal = Duration(milliseconds: 250);
  static const Duration animSlow = Duration(milliseconds: 400);
  static const Duration animVerySlow = Duration(milliseconds: 600);

  static const Curve animCurve = Curves.easeOutCubic;
  static const Curve animCurveBounce = Curves.easeOutBack;
  static const Curve animCurveSharp = Curves.easeInOutCubic;

  // === TOUCH TARGETS ===
  static const double minTouchTarget = 44.0;
  static const double preferredTouchTarget = 48.0;

  // === ICON SIZES ===
  static const double iconSm = 16.0;
  static const double iconMd = 20.0;
  static const double iconLg = 24.0;
  static const double iconXl = 32.0;
  static const double icon2xl = 40.0;
  static const double icon3xl = 48.0;

  // === BOTTOM NAV ===
  static const double bottomNavHeight = 72.0;
  static const double bottomNavIconSize = 24.0;
}
