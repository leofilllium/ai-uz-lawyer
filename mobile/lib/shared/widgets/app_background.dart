import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../config/theme/app_colors.dart';

class AppBackground extends StatefulWidget {
  final Widget child;

  const AppBackground({super.key, required this.child});

  @override
  State<AppBackground> createState() => _AppBackgroundState();
}

class _AppBackgroundState extends State<AppBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        // Base gradient
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? [
                      const Color(0xFF0F1117),
                      const Color(0xFF131620),
                      const Color(0xFF0F1117),
                    ]
                  : [
                      const Color(0xFFFAFAFC),
                      const Color(0xFFF5F3FF),
                      const Color(0xFFFFF5F7),
                      const Color(0xFFFAFAFC),
                    ],
              stops: isDark ? [0.0, 0.5, 1.0] : [0.0, 0.3, 0.7, 1.0],
            ),
          ),
        ),

        // Animated gradient blobs
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final t = _controller.value;
            return Stack(
              children: [
                // Primary blob (top-left)
                Positioned(
                  top: -120 + math.sin(t * 2 * math.pi) * 30,
                  left: -80 + math.cos(t * 2 * math.pi) * 20,
                  child: _GradientBlob(
                    size: 380,
                    colors: isDark
                        ? [
                            AppColors.primary.withValues(alpha: 0.12),
                            AppColors.primary.withValues(alpha: 0.04),
                          ]
                        : [
                            AppColors.primary.withValues(alpha: 0.06),
                            AppColors.primary.withValues(alpha: 0.01),
                          ],
                  ),
                ),
                // Secondary blob (bottom-right)
                Positioned(
                  bottom: -100 + math.cos(t * 2 * math.pi + 1) * 25,
                  right: -60 + math.sin(t * 2 * math.pi + 1) * 15,
                  child: _GradientBlob(
                    size: 320,
                    colors: isDark
                        ? [
                            AppColors.accentBlue.withValues(alpha: 0.10),
                            AppColors.accentBlue.withValues(alpha: 0.02),
                          ]
                        : [
                            AppColors.accentBlue.withValues(alpha: 0.05),
                            AppColors.accentBlue.withValues(alpha: 0.01),
                          ],
                  ),
                ),
                // Tertiary blob (mid-right)
                if (isDark)
                  Positioned(
                    top: 280 + math.sin(t * 2 * math.pi + 2) * 20,
                    right: -40 + math.cos(t * 2 * math.pi + 2) * 15,
                    child: _GradientBlob(
                      size: 200,
                      colors: [
                        AppColors.accentIndigo.withValues(alpha: 0.08),
                        AppColors.accentIndigo.withValues(alpha: 0.02),
                      ],
                    ),
                  ),
              ],
            );
          },
        ),

        // Blur overlay
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
          child: Container(color: Colors.transparent),
        ),

        // Subtle noise overlay for depth
        Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: Alignment.topCenter,
              radius: 1.5,
              colors: [
                Colors.transparent,
                (isDark ? Colors.black : Colors.white).withValues(alpha: 0.02),
              ],
            ),
          ),
        ),

        // Child content
        widget.child,
      ],
    );
  }
}

class _GradientBlob extends StatelessWidget {
  final double size;
  final List<Color> colors;

  const _GradientBlob({required this.size, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: colors,
          stops: const [0.0, 1.0],
        ),
      ),
    );
  }
}
