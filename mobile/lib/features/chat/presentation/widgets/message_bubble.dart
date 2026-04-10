import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../domain/entities/chat_message.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/utils/markdown_styler.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isStreaming;

  const MessageBubble({
    super.key,
    required this.message,
    this.isStreaming = false,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    final colors = context.colors;
    final customColors = context.customColors;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXs),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // Role label
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 4, bottom: 4),
            child: Text(
              isUser ? context.l10n.you : context.l10n.aiLawyer,
              style: AppTextStyles.labelSmall.copyWith(
                color: colors.onSurface.withValues(alpha: 0.5),
                fontSize: 10,
              ),
            ),
          ),
          Container(
            constraints: BoxConstraints(
              maxWidth: isUser
                  ? MediaQuery.of(context).size.width * 0.8
                  : double.infinity,
            ),
            padding: isUser
                ? const EdgeInsets.all(DesignSystem.spacingMd)
                : const EdgeInsets.all(DesignSystem.spacingXs),
            decoration: isUser
                ? BoxDecoration(
                    gradient: customColors.primaryGradient,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(DesignSystem.radiusLg),
                      topRight: Radius.circular(DesignSystem.radiusLg),
                      bottomLeft: Radius.circular(DesignSystem.radiusLg),
                      bottomRight: Radius.circular(4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (colors.primary).withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                        spreadRadius: -2,
                      )
                    ],
                  )
                : null,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isUser)
                  MarkdownBody(
                    data: message.content,
                    selectable: true,
                    styleSheet: MarkdownStyler.getStyle(context, isUser: true),
                  )
                else
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MarkdownBody(
                        data: message.content,
                        selectable: true,
                        styleSheet: MarkdownStyler.getStyle(context),
                      ),
                      if (isStreaming)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: SizedBox(
                            width: 24,
                            height: 8,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: List.generate(3, (i) {
                                return AnimatedContainer(
                                  duration:
                                      Duration(milliseconds: 300 + i * 100),
                                  width: 6,
                                  height: 6,
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 1),
                                  decoration: BoxDecoration(
                                    color:
                                        (colors.primary).withValues(alpha: 0.5),
                                    shape: BoxShape.circle,
                                  ),
                                );
                              }),
                            ),
                          ),
                        ),
                      if (message.sources != null &&
                          message.sources!.isNotEmpty) ...[
                        const SizedBox(height: DesignSystem.spacingBase),
                        Divider(
                          color: colors.outlineVariant,
                        ),
                        _SourcesExpander(sources: message.sources!),
                      ],
                    ],
                  ),
              ],
            ),
          ),
          if (message.createdAt != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
              child: Text(
                _formatDate(message.createdAt!),
                style: AppTextStyles.caption.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.5),
                  fontSize: 10,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }
}

class _SourcesExpander extends StatelessWidget {
  final List<Source> sources;

  const _SourcesExpander({required this.sources});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return ExpansionTile(
      title: Row(
        children: [
          Icon(
            Icons.library_books_outlined,
            size: 16,
            color: colors.primary,
          ),
          const SizedBox(width: 8),
          Text(
            '${context.l10n.sources} (${sources.length})',
            style: AppTextStyles.label.copyWith(
              color: colors.primary,
            ),
          ),
        ],
      ),
      tilePadding: EdgeInsets.zero,
      childrenPadding: EdgeInsets.zero,
      iconColor: colors.primary,
      collapsedIconColor: colors.primary,
      shape: const RoundedRectangleBorder(side: BorderSide.none),
      children: sources.map((source) => _SourceCard(source: source)).toList(),
    );
  }
}

class _SourceCard extends StatelessWidget {
  final Source source;

  const _SourceCard({required this.source});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingSm),
      child: GlassCard(
        padding: const EdgeInsets.all(DesignSystem.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    source.title ?? source.article ?? 'Source',
                    style: AppTextStyles.label.copyWith(
                      fontWeight: FontWeight.w600,
                      color: colors.onSurface,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(
                        ClipboardData(text: source.preview ?? ""));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(context.l10n.copiedToClipboard)),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: colors.surfaceContainerHighest,
                      borderRadius:
                          BorderRadius.circular(DesignSystem.radiusSm),
                    ),
                    child: Icon(
                      Icons.copy_rounded,
                      size: 14,
                      color: colors.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ),
              ],
            ),
            if (source.source != null) ...[
              const SizedBox(height: 4),
              Text(
                source.source!,
                style: AppTextStyles.caption.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
            if (source.preview != null) ...[
              const SizedBox(height: 8),
              Text(
                source.preview!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.7),
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
