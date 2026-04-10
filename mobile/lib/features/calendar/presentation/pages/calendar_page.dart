import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_colors.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/feature_icon.dart';
import '../bloc/calendar_bloc.dart';
import '../bloc/calendar_event.dart';
import '../bloc/calendar_state.dart';

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  DateTime _currentDate = DateTime.now();

  static const _monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  void _loadEvents() {
    context.read<CalendarBloc>().add(
          LoadCalendarEvents(
            year: _currentDate.year,
            month: _currentDate.month,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Календарь'),
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
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GlassCard(
              padding: const EdgeInsets.all(8),
              borderRadius: DesignSystem.radiusSm,
              onTap: () {},
              interactive: true,
              child: Icon(
                Icons.add_rounded,
                size: 22,
                color: colors.primary,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Month navigation
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: DesignSystem.horizontalMarginMobile,
              vertical: DesignSystem.spacingSm,
            ),
            child: GlassCard(
              padding: const EdgeInsets.symmetric(
                horizontal: DesignSystem.spacingSm,
                vertical: DesignSystem.spacingXs,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: Icon(
                      Icons.chevron_left_rounded,
                      color: colors.onSurface,
                    ),
                    onPressed: () {
                      setState(() {
                        _currentDate = DateTime(
                            _currentDate.year, _currentDate.month - 1, 1);
                      });
                      _loadEvents();
                    },
                  ),
                  Text(
                    '${_monthNames[_currentDate.month - 1]} ${_currentDate.year}',
                    style: AppTextStyles.heading3.copyWith(
                      color: colors.onSurface,
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.chevron_right_rounded,
                      color: colors.onSurface,
                    ),
                    onPressed: () {
                      setState(() {
                        _currentDate = DateTime(
                            _currentDate.year, _currentDate.month + 1, 1);
                      });
                      _loadEvents();
                    },
                  ),
                ],
              ),
            ),
          ),
          // Events list
          Expanded(
            child: BlocConsumer<CalendarBloc, CalendarState>(
              listener: (context, state) {
                if (state is CalendarError) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(state.message)),
                  );
                } else if (state is CalendarOperationSuccess) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(state.message)),
                  );
                }
              },
              builder: (context, state) {
                if (state is CalendarLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (state is CalendarLoaded) {
                  final events = state.events;
                  if (events.isEmpty) {
                    return const EmptyState(
                      icon: Icons.event_busy_rounded,
                      title: 'В этом месяце нет событий',
                      subtitle: 'Нажмите +, чтобы добавить событие',
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: DesignSystem.horizontalMarginMobile,
                    ),
                    itemCount: events.length,
                    itemBuilder: (context, index) {
                      final event = events[index];
                      return Padding(
                        padding: const EdgeInsets.only(
                            bottom: DesignSystem.spacingMd),
                        child: GlassCard(
                          accentColor: AppColors.accentCyan,
                          child: Row(
                            children: [
                              const FeatureIcon(
                                icon: Icons.event_rounded,
                                color: AppColors.accentCyan,
                                size: 42,
                                iconSize: 20,
                              ),
                              const SizedBox(width: DesignSystem.spacingMd),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      event.title,
                                      style: AppTextStyles.heading3.copyWith(
                                        fontSize: 15,
                                        color: colors.onSurface,
                                      ),
                                    ),
                                    if (event.description != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        event.description!,
                                        style: AppTextStyles.caption.copyWith(
                                          color: colors.onSurface
                                              .withValues(alpha: 0.7),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                    const SizedBox(height: 4),
                                    Text(
                                      event.eventDatetime,
                                      style: AppTextStyles.caption.copyWith(
                                        color: colors.onSurface
                                            .withValues(alpha: 0.5),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              GlassCard(
                                padding: const EdgeInsets.all(6),
                                borderRadius: DesignSystem.radiusSm,
                                onTap: () {
                                  context
                                      .read<CalendarBloc>()
                                      .add(DeleteCalendarEvent(event.id));
                                },
                                interactive: true,
                                child: Icon(
                                  Icons.delete_outline_rounded,
                                  size: 18,
                                  color: AppColors.error.withValues(alpha: 0.7),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                }
                return const Center(child: Text('Загрузка календаря...'));
              },
            ),
          ),
        ],
      ),
    );
  }
}
