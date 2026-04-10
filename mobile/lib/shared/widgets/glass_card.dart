import 'package:flutter/material.dart';
import '../../config/theme/app_colors.dart';
import '../../config/theme/design_system.dart';

/// A styled card with optional accent color and tap interaction.
///
/// Uses solid surface colors instead of BackdropFilter for performance.
class GlassCard extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool interactive;
  final double? borderRadius;
  final Color? accentColor;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.interactive = false,
    this.borderRadius,
    this.accentColor,
  });

  @override
  State<GlassCard> createState() => _GlassCardState();
}

class _GlassCardState extends State<GlassCard>
    with SingleTickerProviderStateMixin {
  bool _isPressed = false;
  late AnimationController _animController;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: DesignSystem.animFast,
      vsync: this,
    );
    _scaleAnim = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _animController, curve: DesignSystem.animCurve),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) {
    if (!_isInteractive) return;
    setState(() => _isPressed = true);
    _animController.forward();
  }

  void _onTapUp(TapUpDetails _) {
    if (!_isInteractive) return;
    setState(() => _isPressed = false);
    _animController.reverse();
  }

  void _onTapCancel() {
    if (!_isInteractive) return;
    setState(() => _isPressed = false);
    _animController.reverse();
  }

  bool get _isInteractive => widget.onTap != null || widget.interactive;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = widget.borderRadius ?? DesignSystem.cardRadius;

    final cardContent = AnimatedContainer(
      duration: DesignSystem.animFast,
      padding: widget.padding ?? const EdgeInsets.all(DesignSystem.spacingBase),
      decoration: BoxDecoration(
        color: isDark
            ? (_isPressed
                ? AppColors.darkSurfaceBright.withValues(alpha: 0.65)
                : AppColors.darkSurfaceElevated.withValues(alpha: 0.6))
            : (_isPressed
                ? AppColors.surface.withValues(alpha: 0.95)
                : AppColors.surface.withValues(alpha: 0.88)),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: widget.accentColor != null
              ? widget.accentColor!.withValues(alpha: isDark ? 0.3 : 0.2)
              : (isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.white.withValues(alpha: 0.6)),
          width: 1,
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                  spreadRadius: -2,
                ),
              ],
      ),
      child: widget.child,
    );

    if (!_isInteractive) return cardContent;

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _scaleAnim,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnim.value,
            child: child,
          );
        },
        child: cardContent,
      ),
    );
  }
}
