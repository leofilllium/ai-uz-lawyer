import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import '../../../../config/theme/design_system.dart';
import 'home_page.dart';
import '../../../tasks/presentation/pages/project_board_page.dart';
import '../../../history/presentation/pages/history_page.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';

class MainNavigationPage extends StatefulWidget {
  const MainNavigationPage({super.key});

  static MainNavigationPageState? of(BuildContext context) {
    return context.findAncestorStateOfType<MainNavigationPageState>();
  }

  @override
  State<MainNavigationPage> createState() => MainNavigationPageState();
}

class MainNavigationPageState extends State<MainNavigationPage> {
  int _selectedIndex = 0;

  void setIndex(int index) {
    setState(() => _selectedIndex = index);
  }

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      const HomePage(),
      const ProjectBoardPage(),
      const HistoryPage(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      extendBody: true,
      bottomNavigationBar: _BottomNavBar(
        selectedIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: [
          _NavItem(
            icon: Icons.home_outlined,
            activeIcon: Icons.home_rounded,
            label: context.l10n.home,
          ),
          const _NavItem(
            icon: Icons.task_alt_outlined,
            activeIcon: Icons.task_alt_rounded,
            label: 'Задачи',
          ),
          _NavItem(
            icon: Icons.history_outlined,
            activeIcon: Icons.history_rounded,
            label: context.l10n.history,
          ),
        ],
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

class _BottomNavBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTap;
  final List<_NavItem> items;

  const _BottomNavBar({
    required this.selectedIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(DesignSystem.radiusXl),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            height: DesignSystem.bottomNavHeight,
            decoration: BoxDecoration(
              color: colors.surface.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(DesignSystem.radiusXl),
              border: Border.all(
                color: colors.outlineVariant,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 24,
                  offset: const Offset(0, -4),
                  spreadRadius: -4,
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(items.length, (index) {
                final item = items[index];
                final isSelected = index == selectedIndex;

                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onTap(index),
                    child: AnimatedContainer(
                      duration: DesignSystem.animNormal,
                      curve: DesignSystem.animCurve,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedContainer(
                            duration: DesignSystem.animNormal,
                            curve: DesignSystem.animCurve,
                            padding: EdgeInsets.symmetric(
                              horizontal: isSelected ? 16 : 0,
                              vertical: isSelected ? 6 : 0,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? (colors.primary).withValues(alpha: 0.12)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(
                                  DesignSystem.chipRadius),
                            ),
                            child: Icon(
                              isSelected ? item.activeIcon : item.icon,
                              size: DesignSystem.bottomNavIconSize,
                              color: isSelected
                                  ? (colors.primary)
                                  : (colors.onSurface.withValues(alpha: 0.5)),
                            ),
                          ),
                          const SizedBox(height: 4),
                          AnimatedDefaultTextStyle(
                            duration: DesignSystem.animNormal,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                              color: isSelected
                                  ? (colors.primary)
                                  : (colors.onSurface.withValues(alpha: 0.5)),
                            ),
                            child: Text(item.label),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
