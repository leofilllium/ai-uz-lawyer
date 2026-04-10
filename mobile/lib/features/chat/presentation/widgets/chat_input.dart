import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

class ChatInput extends StatefulWidget {
  final Function(String) onSend;
  final bool isLoading;

  const ChatInput({
    super.key,
    required this.onSend,
    this.isLoading = false,
  });

  @override
  State<ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<ChatInput> {
  final _controller = TextEditingController();
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final hasText = _controller.text.trim().isNotEmpty;
      if (hasText != _hasText) {
        setState(() => _hasText = hasText);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleSend() {
    if (_controller.text.trim().isNotEmpty && !widget.isLoading) {
      widget.onSend(_controller.text.trim());
      _controller.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final customColors = context.customColors;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: DesignSystem.spacingBase,
        vertical: DesignSystem.spacingSm,
      ),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.9),
        border: Border(
          top: BorderSide(
            color: colors.outlineVariant,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: colors.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(DesignSystem.radius2xl),
                ),
                child: TextField(
                  controller: _controller,
                  maxLines: 4,
                  minLines: 1,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: colors.onSurface,
                  ),
                  decoration: InputDecoration(
                    hintText: context.l10n.enterLegalQuestion,
                    hintStyle: AppTextStyles.bodyMedium.copyWith(
                      color: colors.onSurface.withValues(alpha: 0.5),
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (_) => _handleSend(),
                ),
              ),
            ),
            const SizedBox(width: DesignSystem.spacingSm),
            AnimatedContainer(
              duration: DesignSystem.animFast,
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: _hasText && !widget.isLoading
                    ? (customColors.primaryGradient)
                    : null,
                color: !_hasText || widget.isLoading
                    ? (colors.surfaceContainerHighest)
                    : null,
                borderRadius: BorderRadius.circular(DesignSystem.radiusFull),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: widget.isLoading ? null : _handleSend,
                  borderRadius: BorderRadius.circular(DesignSystem.radiusFull),
                  child: widget.isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Icon(
                          Icons.arrow_upward_rounded,
                          size: 22,
                          color: _hasText
                              ? Colors.white
                              : (colors.onSurface.withValues(alpha: 0.5)),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
