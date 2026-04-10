import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ru')
  ];

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @chat.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get chat;

  /// No description provided for @validator.
  ///
  /// In en, this message translates to:
  /// **'Validator'**
  String get validator;

  /// No description provided for @generator.
  ///
  /// In en, this message translates to:
  /// **'Generator'**
  String get generator;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @lawyerConsultation.
  ///
  /// In en, this message translates to:
  /// **'AI Lawyer Consultation'**
  String get lawyerConsultation;

  /// No description provided for @askQuestionPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Ask a legal question...'**
  String get askQuestionPlaceholder;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @startConversation.
  ///
  /// In en, this message translates to:
  /// **'Start a conversation'**
  String get startConversation;

  /// No description provided for @noMessages.
  ///
  /// In en, this message translates to:
  /// **'No messages yet'**
  String get noMessages;

  /// No description provided for @askFirstQuestion.
  ///
  /// In en, this message translates to:
  /// **'Ask your first legal question below'**
  String get askFirstQuestion;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome back,'**
  String get welcomeBack;

  /// No description provided for @quickActions.
  ///
  /// In en, this message translates to:
  /// **'Quick Actions'**
  String get quickActions;

  /// No description provided for @aiLawyerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Legal consultation'**
  String get aiLawyerSubtitle;

  /// No description provided for @validatorSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Check contracts'**
  String get validatorSubtitle;

  /// No description provided for @generatorSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Create docs'**
  String get generatorSubtitle;

  /// No description provided for @historySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your activity'**
  String get historySubtitle;

  /// No description provided for @recentActivity.
  ///
  /// In en, this message translates to:
  /// **'Recent Activity'**
  String get recentActivity;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View All'**
  String get viewAll;

  /// No description provided for @noRecentActivity.
  ///
  /// In en, this message translates to:
  /// **'No recent activity'**
  String get noRecentActivity;

  /// No description provided for @generated.
  ///
  /// In en, this message translates to:
  /// **'Generated'**
  String get generated;

  /// No description provided for @validation.
  ///
  /// In en, this message translates to:
  /// **'Validation'**
  String get validation;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get completed;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get signIn;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signUp;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get fullName;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPassword;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get dontHaveAccount;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get alreadyHaveAccount;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// No description provided for @welcomeBackTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get welcomeBackTitle;

  /// No description provided for @signInSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to your account to continue'**
  String get signInSubtitle;

  /// No description provided for @joinAiLawyer.
  ///
  /// In en, this message translates to:
  /// **'Join AI Lawyer'**
  String get joinAiLawyer;

  /// No description provided for @getExpertGuidance.
  ///
  /// In en, this message translates to:
  /// **'Get expert legal guidance at your fingertips'**
  String get getExpertGuidance;

  /// No description provided for @termsPolicy.
  ///
  /// In en, this message translates to:
  /// **'By signing up, you agree to our Terms of Service and Privacy Policy.'**
  String get termsPolicy;

  /// No description provided for @pleaseEnterEmail.
  ///
  /// In en, this message translates to:
  /// **'Please enter your email'**
  String get pleaseEnterEmail;

  /// No description provided for @pleaseEnterPassword.
  ///
  /// In en, this message translates to:
  /// **'Please enter your password'**
  String get pleaseEnterPassword;

  /// No description provided for @pleaseEnterName.
  ///
  /// In en, this message translates to:
  /// **'Please enter your name'**
  String get pleaseEnterName;

  /// No description provided for @passwordShort.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters'**
  String get passwordShort;

  /// No description provided for @contractTooShort.
  ///
  /// In en, this message translates to:
  /// **'Contract text is too short. Please provide at least 50 characters.'**
  String get contractTooShort;

  /// No description provided for @contractValidator.
  ///
  /// In en, this message translates to:
  /// **'Contract Validator'**
  String get contractValidator;

  /// No description provided for @analyzingContract.
  ///
  /// In en, this message translates to:
  /// **'Analyzing contract...'**
  String get analyzingContract;

  /// No description provided for @takeAMinute.
  ///
  /// In en, this message translates to:
  /// **'This may take a minute'**
  String get takeAMinute;

  /// No description provided for @analyzeAnother.
  ///
  /// In en, this message translates to:
  /// **'Analyze Another'**
  String get analyzeAnother;

  /// No description provided for @checkYourContract.
  ///
  /// In en, this message translates to:
  /// **'Check Your Contract'**
  String get checkYourContract;

  /// No description provided for @pasteContractInstruction.
  ///
  /// In en, this message translates to:
  /// **'Paste your contract text below to get an AI-powered legal analysis, spotting risks and missing clauses.'**
  String get pasteContractInstruction;

  /// No description provided for @pasteContractHint.
  ///
  /// In en, this message translates to:
  /// **'Paste contract text here...'**
  String get pasteContractHint;

  /// No description provided for @analyzeContractButton.
  ///
  /// In en, this message translates to:
  /// **'Analyze Contract'**
  String get analyzeContractButton;

  /// No description provided for @detailsTooShort.
  ///
  /// In en, this message translates to:
  /// **'Please provide more details (at least 20 characters).'**
  String get detailsTooShort;

  /// No description provided for @contractGenerator.
  ///
  /// In en, this message translates to:
  /// **'Contract Generator'**
  String get contractGenerator;

  /// No description provided for @templatesAvailable.
  ///
  /// In en, this message translates to:
  /// **'templates available'**
  String get templatesAvailable;

  /// No description provided for @selectedCategory.
  ///
  /// In en, this message translates to:
  /// **'Selected Category'**
  String get selectedCategory;

  /// No description provided for @requirements.
  ///
  /// In en, this message translates to:
  /// **'Requirements'**
  String get requirements;

  /// No description provided for @requirementsDescription.
  ///
  /// In en, this message translates to:
  /// **'Describe specifically what you need in this contract. Mention names, dates, amounts, and any special conditions.'**
  String get requirementsDescription;

  /// No description provided for @requirementsHint.
  ///
  /// In en, this message translates to:
  /// **'E.g., I need a sales contract for 500 widgets delivery to Tashkent by next Friday...'**
  String get requirementsHint;

  /// No description provided for @generateContractButton.
  ///
  /// In en, this message translates to:
  /// **'Generate Contract'**
  String get generateContractButton;

  /// No description provided for @generatingContract.
  ///
  /// In en, this message translates to:
  /// **'Generating your contract...'**
  String get generatingContract;

  /// No description provided for @startOver.
  ///
  /// In en, this message translates to:
  /// **'Start Over'**
  String get startOver;

  /// No description provided for @copySave.
  ///
  /// In en, this message translates to:
  /// **'Copy / Save'**
  String get copySave;

  /// No description provided for @contractCopied.
  ///
  /// In en, this message translates to:
  /// **'Contract copied to clipboard!'**
  String get contractCopied;

  /// No description provided for @chats.
  ///
  /// In en, this message translates to:
  /// **'Chats'**
  String get chats;

  /// No description provided for @validations.
  ///
  /// In en, this message translates to:
  /// **'Validations'**
  String get validations;

  /// No description provided for @contracts.
  ///
  /// In en, this message translates to:
  /// **'Contracts'**
  String get contracts;

  /// No description provided for @noChatHistory.
  ///
  /// In en, this message translates to:
  /// **'No chat history found.'**
  String get noChatHistory;

  /// No description provided for @noValidationHistory.
  ///
  /// In en, this message translates to:
  /// **'No validation history.'**
  String get noValidationHistory;

  /// No description provided for @noGeneratedContracts.
  ///
  /// In en, this message translates to:
  /// **'No generated contracts.'**
  String get noGeneratedContracts;

  /// No description provided for @messagesCount.
  ///
  /// In en, this message translates to:
  /// **'messages'**
  String get messagesCount;

  /// No description provided for @consultant.
  ///
  /// In en, this message translates to:
  /// **'📚 Юрист-консультант'**
  String get consultant;

  /// No description provided for @riskManager.
  ///
  /// In en, this message translates to:
  /// **'🛡️ Риск-менеджер'**
  String get riskManager;

  /// No description provided for @memorandum.
  ///
  /// In en, this message translates to:
  /// **'⚖️ ЮРИДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ'**
  String get memorandum;

  /// No description provided for @quickAnswer.
  ///
  /// In en, this message translates to:
  /// **'⚡ Быстрый ответ'**
  String get quickAnswer;

  /// No description provided for @smalltalk.
  ///
  /// In en, this message translates to:
  /// **'💬 Просто пообщаться'**
  String get smalltalk;

  /// No description provided for @criminalDefense.
  ///
  /// In en, this message translates to:
  /// **'⚖️ Адвокат (Защита)'**
  String get criminalDefense;

  /// No description provided for @criminalProsecution.
  ///
  /// In en, this message translates to:
  /// **'⚔️ Прокурор (Обвинение)'**
  String get criminalProsecution;

  /// No description provided for @adminDefense.
  ///
  /// In en, this message translates to:
  /// **'🛡️ Адм. защита (Штрафы)'**
  String get adminDefense;

  /// No description provided for @adminProcedure.
  ///
  /// In en, this message translates to:
  /// **'📋 Адм. процедуры'**
  String get adminProcedure;

  /// No description provided for @corporate.
  ///
  /// In en, this message translates to:
  /// **'🏢 Корпоративный юрист'**
  String get corporate;

  /// No description provided for @commercial.
  ///
  /// In en, this message translates to:
  /// **'📜 Коммерческий юрист'**
  String get commercial;

  /// No description provided for @startup.
  ///
  /// In en, this message translates to:
  /// **'📈 Юрист для стартапов'**
  String get startup;

  /// No description provided for @mergerAcquisition.
  ///
  /// In en, this message translates to:
  /// **'🤝 Слияния (M&A)'**
  String get mergerAcquisition;

  /// No description provided for @antitrust.
  ///
  /// In en, this message translates to:
  /// **'🛡️ Антимонопольный юрист'**
  String get antitrust;

  /// No description provided for @bankruptcy.
  ///
  /// In en, this message translates to:
  /// **'🏚️ Банкротство'**
  String get bankruptcy;

  /// No description provided for @procurement.
  ///
  /// In en, this message translates to:
  /// **'🏛️ Госзакупки'**
  String get procurement;

  /// No description provided for @licensing.
  ///
  /// In en, this message translates to:
  /// **'📋 Лицензирование'**
  String get licensing;

  /// No description provided for @regulatory.
  ///
  /// In en, this message translates to:
  /// **'🌐 Регуляторный комплаенс'**
  String get regulatory;

  /// No description provided for @tax.
  ///
  /// In en, this message translates to:
  /// **'🧾 Налоговый юрист'**
  String get tax;

  /// No description provided for @banking.
  ///
  /// In en, this message translates to:
  /// **'🏦 Банковский юрист'**
  String get banking;

  /// No description provided for @securities.
  ///
  /// In en, this message translates to:
  /// **'📈 Ценные бумаги и IPO'**
  String get securities;

  /// No description provided for @insurance.
  ///
  /// In en, this message translates to:
  /// **'🛡️ Страховой юрист'**
  String get insurance;

  /// No description provided for @debtCollection.
  ///
  /// In en, this message translates to:
  /// **'💸 Взыскание долгов'**
  String get debtCollection;

  /// No description provided for @investorProtection.
  ///
  /// In en, this message translates to:
  /// **'🛡️ Защита инвесторов'**
  String get investorProtection;

  /// No description provided for @crossBorder.
  ///
  /// In en, this message translates to:
  /// **'🌍 Трансграничные сделки'**
  String get crossBorder;

  /// No description provided for @customs.
  ///
  /// In en, this message translates to:
  /// **'🚢 Таможенный юрист'**
  String get customs;

  /// No description provided for @realEstate.
  ///
  /// In en, this message translates to:
  /// **'🏠 Недвижимость'**
  String get realEstate;

  /// No description provided for @housing.
  ///
  /// In en, this message translates to:
  /// **'🏘️ Жилищное право (ЖКХ)'**
  String get housing;

  /// No description provided for @landDisputes.
  ///
  /// In en, this message translates to:
  /// **'🌾 Земельные споры'**
  String get landDisputes;

  /// No description provided for @family.
  ///
  /// In en, this message translates to:
  /// **'👨‍👩‍👧 Семейный юрист'**
  String get family;

  /// No description provided for @consumerProtection.
  ///
  /// In en, this message translates to:
  /// **'🛒 Защита прав потребителей'**
  String get consumerProtection;

  /// No description provided for @notary.
  ///
  /// In en, this message translates to:
  /// **'📜 Нотариус'**
  String get notary;

  /// No description provided for @hr.
  ///
  /// In en, this message translates to:
  /// **'👷 HR-юрист'**
  String get hr;

  /// No description provided for @workerProtection.
  ///
  /// In en, this message translates to:
  /// **'👷 Защита прав работника'**
  String get workerProtection;

  /// No description provided for @complianceHr.
  ///
  /// In en, this message translates to:
  /// **'👥 HR-комплаенс'**
  String get complianceHr;

  /// No description provided for @litigator.
  ///
  /// In en, this message translates to:
  /// **'🏛️ Судебный юрист'**
  String get litigator;

  /// No description provided for @procedural.
  ///
  /// In en, this message translates to:
  /// **'📝 Процессуалист'**
  String get procedural;

  /// No description provided for @arbitration.
  ///
  /// In en, this message translates to:
  /// **'🤝 Арбитраж'**
  String get arbitration;

  /// No description provided for @mediation.
  ///
  /// In en, this message translates to:
  /// **'🕊️ Медиация'**
  String get mediation;

  /// No description provided for @enforcement.
  ///
  /// In en, this message translates to:
  /// **'⚡ Исполнение решений'**
  String get enforcement;

  /// No description provided for @deadlines.
  ///
  /// In en, this message translates to:
  /// **'⏳ Сроки и давность'**
  String get deadlines;

  /// No description provided for @forensicLegal.
  ///
  /// In en, this message translates to:
  /// **'🔬 Судебная экспертиза'**
  String get forensicLegal;

  /// No description provided for @constitutional.
  ///
  /// In en, this message translates to:
  /// **'🏛️ Конституционное право'**
  String get constitutional;

  /// No description provided for @ip.
  ///
  /// In en, this message translates to:
  /// **'💡 IP-юрист (Авторское)'**
  String get ip;

  /// No description provided for @digitalLaw.
  ///
  /// In en, this message translates to:
  /// **'💻 Цифровое право (IT)'**
  String get digitalLaw;

  /// No description provided for @legalAudit.
  ///
  /// In en, this message translates to:
  /// **'🚨 Юридический аудит'**
  String get legalAudit;

  /// No description provided for @compliance.
  ///
  /// In en, this message translates to:
  /// **'🛡️ Общий комплаенс'**
  String get compliance;

  /// No description provided for @environmental.
  ///
  /// In en, this message translates to:
  /// **'🌿 Экологическое право'**
  String get environmental;

  /// No description provided for @docReview.
  ///
  /// In en, this message translates to:
  /// **'📄 Проверка документа'**
  String get docReview;

  /// No description provided for @legalLetter.
  ///
  /// In en, this message translates to:
  /// **'✉️ Написать претензию'**
  String get legalLetter;

  /// No description provided for @negotiator.
  ///
  /// In en, this message translates to:
  /// **'🤝 Переговорщик'**
  String get negotiator;

  /// No description provided for @interviewPractice.
  ///
  /// In en, this message translates to:
  /// **'🎤 Интервьюер'**
  String get interviewPractice;

  /// No description provided for @analyst.
  ///
  /// In en, this message translates to:
  /// **'🧩 Аналитик'**
  String get analyst;

  /// No description provided for @skeptic.
  ///
  /// In en, this message translates to:
  /// **'🔍 Скептик'**
  String get skeptic;

  /// No description provided for @strategist.
  ///
  /// In en, this message translates to:
  /// **'🤖 Стратег'**
  String get strategist;

  /// No description provided for @judgeQuestions.
  ///
  /// In en, this message translates to:
  /// **'⚖️ Вопросы судьи'**
  String get judgeQuestions;

  /// No description provided for @odds.
  ///
  /// In en, this message translates to:
  /// **'📊 Шансы на успех'**
  String get odds;

  /// No description provided for @whatIf.
  ///
  /// In en, this message translates to:
  /// **'🧪 Что если...'**
  String get whatIf;

  /// No description provided for @sources.
  ///
  /// In en, this message translates to:
  /// **'Sources'**
  String get sources;

  /// No description provided for @copiedToClipboard.
  ///
  /// In en, this message translates to:
  /// **'Copied to clipboard'**
  String get copiedToClipboard;

  /// No description provided for @aiLegalAssistant.
  ///
  /// In en, this message translates to:
  /// **'AI Legal Assistant'**
  String get aiLegalAssistant;

  /// No description provided for @you.
  ///
  /// In en, this message translates to:
  /// **'You'**
  String get you;

  /// No description provided for @aiLawyer.
  ///
  /// In en, this message translates to:
  /// **'AI Lawyer'**
  String get aiLawyer;

  /// No description provided for @chooseSpecialist.
  ///
  /// In en, this message translates to:
  /// **'Choose a specialist'**
  String get chooseSpecialist;

  /// No description provided for @chooseExpertForConsultation.
  ///
  /// In en, this message translates to:
  /// **'Choose an AI legal expert for consultation'**
  String get chooseExpertForConsultation;

  /// No description provided for @enterLegalQuestion.
  ///
  /// In en, this message translates to:
  /// **'Enter your legal question...'**
  String get enterLegalQuestion;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ru'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
