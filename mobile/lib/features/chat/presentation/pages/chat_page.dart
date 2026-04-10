import 'package:flutter/material.dart';
import '../../../../config/theme/custom_theme_extension.dart';

import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../config/theme/app_text_styles.dart';
import '../../../../config/theme/design_system.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../bloc/chat_bloc.dart';
import '../bloc/chat_event.dart';
import '../bloc/chat_state.dart';
import '../widgets/chat_input.dart';
import '../widgets/message_bubble.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/chat_modes.dart';
import 'package:ai_lawyer_mobile/core/l10n/l10n.dart';
import '../widgets/chat_mode_selection_view.dart';

class ChatPage extends StatefulWidget {
  final int? sessionId;

  const ChatPage({super.key, this.sessionId});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final ScrollController _scrollController = ScrollController();
  ChatMode? _selectedMode;
  bool _isModeSelected = false;

  @override
  void initState() {
    super.initState();
    if (widget.sessionId != null) {
      _isModeSelected = true;
      context.read<ChatBloc>().add(LoadSessionMessages(widget.sessionId!));
    } else {
      context.read<ChatBloc>().add(LoadChatSessions());
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    if (!_isModeSelected && widget.sessionId == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(context.l10n.lawyerConsultation),
        ),
        body: ChatModeSelectionView(
          onModeSelected: (mode) {
            setState(() {
              _selectedMode = mode;
              _isModeSelected = true;
            });
          },
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              _selectedMode != null
                  ? context.tr(_selectedMode!.labelKey)
                  : context.l10n.lawyerConsultation,
            ),
            if (_selectedMode != null)
              Text(
                context.l10n.aiLegalAssistant,
                style: AppTextStyles.caption.copyWith(
                  color: colors.onSurface.withValues(alpha: 0.5),
                ),
              ),
          ],
        ),
        leading: widget.sessionId == null
            ? IconButton(
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
                onPressed: () => setState(() {
                  _isModeSelected = false;
                  _selectedMode = null;
                }),
              )
            : null,
      ),
      body: Column(
        children: [
          Expanded(
            child: BlocConsumer<ChatBloc, ChatState>(
              listener: (context, state) {
                if (state is ChatMessagesLoaded) {
                  WidgetsBinding.instance
                      .addPostFrameCallback((_) => _scrollToBottom());
                }
              },
              builder: (context, state) {
                if (state is ChatLoading && state is! ChatMessagesLoaded) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state is ChatError) {
                  return Center(
                      child: Text('${context.l10n.error}: ${state.message}'));
                }

                if (state is ChatMessagesLoaded) {
                  final messages = state.messages;
                  final streamingContent = state.streamingContent;

                  if (messages.isEmpty && streamingContent.isEmpty) {
                    return _buildEmptyState();
                  }

                  return ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(
                      DesignSystem.spacingBase,
                      DesignSystem.spacingBase,
                      DesignSystem.spacingBase,
                      DesignSystem.spacingBase + DesignSystem.bottomNavHeight,
                    ),
                    itemCount:
                        messages.length + (streamingContent.isNotEmpty ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index < messages.length) {
                        return MessageBubble(message: messages[index]);
                      } else {
                        return MessageBubble(
                          message: ChatMessage(
                            id: 0,
                            sessionId: state.sessionId,
                            role: 'assistant',
                            content: streamingContent,
                          ),
                          isStreaming: true,
                        );
                      }
                    },
                  );
                }

                if (state is ChatSessionsLoaded || state is ChatInitial) {
                  return _buildEmptyState();
                }

                return Center(child: Text(context.l10n.startConversation));
              },
            ),
          ),
          BlocBuilder<ChatBloc, ChatState>(
            builder: (context, state) {
              bool isLoading = false;
              if (state is ChatMessagesLoaded) {
                isLoading = state.isStreaming;
              }
              return ChatInput(
                isLoading: isLoading,
                onSend: (message) {
                  context.read<ChatBloc>().add(
                        SendChatMessage(message,
                            mode: _selectedMode?.id ?? 'consultant'),
                      );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return EmptyState(
      icon: Icons.chat_bubble_outline_rounded,
      title: context.l10n.noMessages,
      subtitle: context.l10n.askFirstQuestion,
    );
  }
}
