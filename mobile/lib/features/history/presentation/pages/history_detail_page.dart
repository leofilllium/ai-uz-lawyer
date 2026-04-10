import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../config/theme/custom_theme_extension.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/feature_icon.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../../shared/utils/markdown_styler.dart';
import '../../domain/entities/history_item.dart';
import '../../../chat/presentation/bloc/chat_bloc.dart';
import '../../../chat/presentation/bloc/chat_event.dart';
import '../../../chat/presentation/bloc/chat_state.dart';
import '../../../chat/presentation/widgets/message_bubble.dart';
import '../../../validator/data/models/contract_analysis_model.dart';
import '../../../validator/presentation/widgets/analysis_result_view.dart';

/// Full-screen detail page for a history item.
///
/// Displays different content based on [HistoryItem.type]:
/// - `chat`: loads and shows the conversation messages
/// - `validation` / `document_validation`: shows analysis from metadata
/// - `generation`: shows generated contract content from metadata
class HistoryDetailPage extends StatefulWidget {
  final HistoryItem item;

  const HistoryDetailPage({super.key, required this.item});

  @override
  State<HistoryDetailPage> createState() => _HistoryDetailPageState();
}

class _HistoryDetailPageState extends State<HistoryDetailPage> {
  @override
  void initState() {
    super.initState();
    if (widget.item.type == 'chat') {
      context.read<ChatBloc>().add(LoadSessionMessages(widget.item.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    // Determine icon and color based on type
    IconData iconData;
    Color accentColor;
    String typeLabel;

    switch (widget.item.type) {
      case 'chat':
        iconData = Icons.chat_bubble_rounded;
        accentColor = AppColors.primary;
        typeLabel = 'Чат';
        break;
      case 'validation':
        iconData = Icons.verified_rounded;
        accentColor = AppColors.accentBlue;
        typeLabel = 'Анализ договора';
        break;
      case 'document_validation':
        iconData = Icons.document_scanner_rounded;
        accentColor = AppColors.accentBlue;
        typeLabel = 'Анализ документа';
        break;
      case 'generation':
        iconData = Icons.auto_awesome_rounded;
        accentColor = AppColors.accentOrange;
        typeLabel = 'Сгенерированный договор';
        break;
      default:
        iconData = Icons.history_rounded;
        accentColor = colors.onSurface;
        typeLabel = 'История';
    }

    // Format date
    String formattedDate = widget.item.createdAt;
    try {
      final date = DateTime.parse(widget.item.createdAt).toLocal();
      formattedDate = DateFormat('dd MMMM yyyy, HH:mm', 'ru_RU').format(date);
    } catch (_) {}

    return Scaffold(
      appBar: AppBar(
        title: Text(typeLabel),
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(DesignSystem.radiusSm),
            ),
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 16,
              color: colors.onSurface,
            ),
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Header card
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: DesignSystem.horizontalMarginMobile,
              vertical: DesignSystem.spacingSm,
            ),
            child: GlassCard(
              accentColor: accentColor,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FeatureIcon(
                    icon: iconData,
                    color: accentColor,
                    size: 48,
                    iconSize: 24,
                  ),
                  const SizedBox(width: DesignSystem.spacingMd),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.item.title,
                          style: AppTextStyles.heading3.copyWith(
                            color: colors.onSurface,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          formattedDate,
                          style: AppTextStyles.caption.copyWith(
                            color: colors.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                        if (widget.item.type == 'validation' &&
                            widget.item.metadata.containsKey('validity_score'))
                          Padding(
                            padding: const EdgeInsets.only(
                                top: DesignSystem.spacingSm),
                            child: StatusBadge(
                              text:
                                  'Оценка: ${widget.item.metadata['validity_score']}/100',
                              color: _scoreColor(widget
                                  .item.metadata['validity_score'] as num),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Content area
          Expanded(
            child: _buildContent(context),
          ),
        ],
      ),
    );
  }

  Color _scoreColor(num score) {
    if (score > 80) return AppColors.success;
    if (score > 50) return AppColors.warning;
    return AppColors.error;
  }

  Widget _buildContent(BuildContext context) {
    switch (widget.item.type) {
      case 'chat':
        return _buildChatContent(context);
      case 'validation':
      case 'document_validation':
        return _buildValidationContent(context);
      case 'generation':
        return _buildGenerationContent(context);
      default:
        return _buildGenericContent(context);
    }
  }

  /// Shows chat messages for a session.
  Widget _buildChatContent(BuildContext context) {
    return BlocBuilder<ChatBloc, ChatState>(
      builder: (context, state) {
        if (state is ChatLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (state is ChatError) {
          return Center(
            child: Text('Ошибка: ${state.message}'),
          );
        }

        if (state is ChatMessagesLoaded) {
          if (state.messages.isEmpty) {
            return Center(
              child: Text(
                'Нет сообщений',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: context.colors.onSurface.withValues(alpha: 0.5),
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(DesignSystem.spacingBase),
            itemCount: state.messages.length,
            itemBuilder: (context, index) {
              return MessageBubble(message: state.messages[index]);
            },
          );
        }

        return const Center(child: CircularProgressIndicator());
      },
    );
  }

  /// Shows validation/analysis result from metadata.
  ///
  /// Attempts to parse the full analysis JSON stored in metadata and display
  /// it using the same rich [AnalysisResultView] used for live validations.
  Widget _buildValidationContent(BuildContext context) {
    final metadata = widget.item.metadata;

    // If metadata contains a validity_score, it's a full analysis payload —
    // parse it and render the rich view.
    if (metadata.containsKey('validity_score') ||
        metadata.containsKey('critical_errors')) {
      try {
        final analysis = ContractAnalysisModel.fromJson(metadata);
        return AnalysisResultView(analysis: analysis);
      } catch (_) {
        // Fall through to the simple view
      }
    }

    // Fallback: show the preview as markdown.
    final content = metadata['content'] as String? ??
        metadata['analysis'] as String? ??
        metadata['result'] as String? ??
        widget.item.preview;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
      child: GlassCard(
        child: MarkdownBody(
          data: content,
          styleSheet: MarkdownStyler.getStyle(context),
          shrinkWrap: true,
        ),
      ),
    );
  }

  /// Shows generated contract content from metadata, including the original
  /// request parameters (category, requirements) when available.
  Widget _buildGenerationContent(BuildContext context) {
    final colors = context.colors;
    final metadata = widget.item.metadata;

    final content = metadata['content'] as String? ??
        metadata['contract'] as String? ??
        metadata['result'] as String? ??
        widget.item.preview;

    final category = metadata['category'] as String?;
    final requirements =
        metadata['requirements'] as String? ?? metadata['prompt'] as String?;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Request context card
          if (category != null || requirements != null) ...[
            const SectionHeader(
              title: 'Параметры запроса',
              icon: Icons.tune_rounded,
              iconColor: AppColors.accentOrange,
            ),
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (category != null) ...[
                    Row(
                      children: [
                        Icon(Icons.category_rounded,
                            size: 16,
                            color: colors.onSurface.withValues(alpha: 0.5)),
                        const SizedBox(width: 8),
                        Text(
                          'Категория:',
                          style: AppTextStyles.caption.copyWith(
                            color: colors.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            category,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                              color: colors.onSurface,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (category != null && requirements != null)
                    const SizedBox(height: DesignSystem.spacingSm),
                  if (requirements != null) ...[
                    Text(
                      'Требования:',
                      style: AppTextStyles.caption.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      requirements,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: colors.onSurface,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: DesignSystem.spacingXl),
          ],

          // Generated document
          const SectionHeader(
            title: 'Сгенерированный документ',
            icon: Icons.auto_awesome_rounded,
            iconColor: AppColors.accentOrange,
          ),
          GlassCard(
            child: MarkdownBody(
              data: content,
              styleSheet: MarkdownStyler.getStyle(context),
              shrinkWrap: true,
            ),
          ),
        ],
      ),
    );
  }

  /// Fallback for unknown history item types.
  Widget _buildGenericContent(BuildContext context) {
    final colors = context.colors;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(DesignSystem.horizontalMarginMobile),
      child: GlassCard(
        child: Text(
          widget.item.preview,
          style: AppTextStyles.bodyMedium.copyWith(
            color: colors.onSurface,
          ),
        ),
      ),
    );
  }
}
