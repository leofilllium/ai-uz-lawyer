import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/custom_theme_extension.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/feature_icon.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/empty_state.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

import '../bloc/history_bloc.dart';
import '../bloc/history_event.dart';
import '../bloc/history_state.dart';
import '../../domain/entities/history_item.dart';
import '../../../chat/presentation/bloc/chat_bloc.dart';
import 'history_detail_page.dart';
import 'package:intl/intl.dart';

class HistoryPage extends StatelessWidget {
  const HistoryPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _HistoryView();
  }
}

class _HistoryView extends StatefulWidget {
  const _HistoryView();

  @override
  State<_HistoryView> createState() => _HistoryViewState();
}

class _HistoryViewState extends State<_HistoryView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isBottom) {
      context.read<HistoryBloc>().add(const LoadMoreHistory());
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.history),
      ),
      body: Column(
        children: [
          _buildFilterChips(context),
          Expanded(
            child: BlocBuilder<HistoryBloc, HistoryState>(
              builder: (context, state) {
                if (state is HistoryLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (state is HistoryError) {
                  return Center(
                    child: Text('${context.l10n.error}: ${state.message}'),
                  );
                } else if (state is HistoryLoaded) {
                  if (state.items.isEmpty) {
                    return EmptyState(
                      icon: Icons.history_rounded,
                      title: context
                          .l10n.noRecentActivity, // Reusing localized string
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      context
                          .read<HistoryBloc>()
                          .add(LoadHistory(type: state.filterType));
                    },
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(
                        DesignSystem.horizontalMarginMobile,
                        DesignSystem.spacingBase,
                        DesignSystem.horizontalMarginMobile,
                        DesignSystem.bottomNavHeight + 32,
                      ),
                      itemCount: state.hasMore
                          ? state.items.length + 1
                          : state.items.length,
                      itemBuilder: (context, index) {
                        if (index >= state.items.length) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        final item = state.items[index];
                        return _buildHistoryCard(context, item);
                      },
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips(BuildContext context) {
    return BlocBuilder<HistoryBloc, HistoryState>(
      builder: (context, state) {
        String currentFilter = 'all';
        if (state is HistoryLoaded) {
          currentFilter = state.filterType;
        }

        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(
            horizontal: DesignSystem.horizontalMarginMobile,
            vertical: DesignSystem.spacingSm,
          ),
          child: Row(
            children: [
              _FilterChip(
                label:
                    'Все', // Fallback, context.l10n doesn't have "All" translated in the provided list.
                isSelected: currentFilter == 'all',
                onTap: () => context
                    .read<HistoryBloc>()
                    .add(const LoadHistory(type: 'all')),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: context.l10n.chats,
                isSelected: currentFilter == 'chat',
                onTap: () => context
                    .read<HistoryBloc>()
                    .add(const LoadHistory(type: 'chat')),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: context.l10n.validations,
                isSelected: currentFilter == 'validation',
                onTap: () => context
                    .read<HistoryBloc>()
                    .add(const LoadHistory(type: 'validation')),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Документы',
                isSelected: currentFilter == 'document_validation',
                onTap: () => context
                    .read<HistoryBloc>()
                    .add(const LoadHistory(type: 'document_validation')),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: context.l10n.contracts,
                isSelected: currentFilter == 'generation',
                onTap: () => context
                    .read<HistoryBloc>()
                    .add(const LoadHistory(type: 'generation')),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHistoryCard(BuildContext context, HistoryItem item) {
    final colors = context.colors;

    // Determine visuals based on type
    IconData iconData;
    Color accentColor;

    switch (item.type) {
      case 'chat':
        iconData = Icons.chat_bubble_rounded;
        accentColor = AppColors.primary;
        break;
      case 'validation':
        iconData = Icons.verified_rounded;
        accentColor = AppColors.success;

        // If it's a validation, try to override color based on score metadata if available
        if (item.metadata.containsKey('validity_score')) {
          final score = item.metadata['validity_score'] as num;
          if (score <= 40) {
            accentColor = AppColors.error;
          } else if (score <= 70) {
            accentColor = AppColors.warning;
          }
        }
        break;
      case 'document_validation':
        iconData = Icons.document_scanner_rounded;
        accentColor = AppColors.accentBlue;
        break;
      case 'generation':
        iconData = Icons.auto_awesome_rounded;
        accentColor = AppColors.accentOrange;
        break;
      default:
        iconData = Icons.history_rounded;
        accentColor = colors.onSurface.withValues(alpha: 0.5);
    }

    // Format date
    String formattedDate = item.createdAt;
    try {
      final date = DateTime.parse(item.createdAt).toLocal();
      formattedDate = DateFormat('dd MMM yyyy, HH:mm', 'ru_RU').format(date);
    } catch (_) {}

    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingMd),
      child: Dismissible(
        key: Key('history_${item.type}_${item.id}'),
        direction: DismissDirection.endToStart,
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 20),
          decoration: BoxDecoration(
            color: AppColors.error,
            borderRadius: BorderRadius.circular(DesignSystem.radiusLg),
          ),
          child: const Icon(Icons.delete_outline, color: Colors.white),
        ),
        onDismissed: (_) {
          context.read<HistoryBloc>().add(
                DeleteHistoryItemEvent(type: item.type, id: item.id),
              );
        },
        child: GlassCard(
          interactive: true,
          accentColor: accentColor,
          onTap: () => _handleItemTap(context, item),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FeatureIcon(
                icon: iconData,
                color: accentColor,
                size: 42,
                iconSize: 20,
              ),
              const SizedBox(width: DesignSystem.spacingMd),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: AppTextStyles.heading3.copyWith(
                        fontSize: 15,
                        color: colors.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.preview,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.7),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          formattedDate,
                          style: AppTextStyles.caption.copyWith(
                            color: colors.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                        if (item.type == 'validation' &&
                            item.metadata.containsKey('validity_score'))
                          StatusBadge(
                            text: 'Оценка: ${item.metadata['validity_score']}',
                            color: accentColor,
                          )
                        else if (item.type == 'chat' &&
                            item.metadata.containsKey('message_count'))
                          Text(
                            '${item.metadata['message_count']} сообщений',
                            style: AppTextStyles.caption.copyWith(
                              color: colors.onSurface.withValues(alpha: 0.5),
                            ),
                          )
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleItemTap(BuildContext context, HistoryItem item) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => BlocProvider.value(
        value: context.read<ChatBloc>(),
        child: HistoryDetailPage(item: item),
      ),
    ));
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.2)
              : colors.surface.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: AppTextStyles.bodyMedium.copyWith(
            color: isSelected
                ? AppColors.primary
                : colors.onSurface.withValues(alpha: 0.7),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
