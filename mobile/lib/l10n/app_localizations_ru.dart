// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get home => 'Главная';

  @override
  String get chat => 'Чат';

  @override
  String get validator => 'Валидатор';

  @override
  String get generator => 'Генератор';

  @override
  String get history => 'История';

  @override
  String get lawyerConsultation => 'Консультация AI Юриста';

  @override
  String get askQuestionPlaceholder => 'Задайте юридический вопрос...';

  @override
  String get send => 'Отправить';

  @override
  String get startConversation => 'Начните беседу';

  @override
  String get noMessages => 'Сообщений пока нет';

  @override
  String get askFirstQuestion => 'Задайте свой первый юридический вопрос ниже';

  @override
  String get error => 'Ошибка';

  @override
  String get welcomeBack => 'С возвращением,';

  @override
  String get quickActions => 'Быстрые действия';

  @override
  String get aiLawyerSubtitle => 'Юридическая консультация';

  @override
  String get validatorSubtitle => 'Проверка договоров';

  @override
  String get generatorSubtitle => 'Создание документов';

  @override
  String get historySubtitle => 'Ваша активность';

  @override
  String get recentActivity => 'Недавняя активность';

  @override
  String get viewAll => 'Смотреть все';

  @override
  String get noRecentActivity => 'Нет недавней активности';

  @override
  String get generated => 'Сгенерировано';

  @override
  String get validation => 'Валидация';

  @override
  String get completed => 'Завершено';

  @override
  String get signIn => 'Войти';

  @override
  String get signUp => 'Регистрация';

  @override
  String get email => 'Электронная почта';

  @override
  String get password => 'Пароль';

  @override
  String get fullName => 'Полное имя';

  @override
  String get forgotPassword => 'Забыли пароль?';

  @override
  String get dontHaveAccount => 'Нет аккаунта?';

  @override
  String get alreadyHaveAccount => 'Уже есть аккаунт?';

  @override
  String get createAccount => 'Создать аккаунт';

  @override
  String get welcomeBackTitle => 'С возвращением';

  @override
  String get signInSubtitle => 'Войдите в свой аккаунт, чтобы продолжить';

  @override
  String get joinAiLawyer => 'Присоединяйтесь к AI Юристу';

  @override
  String get getExpertGuidance =>
      'Получайте экспертную юридическую помощь на кончиках ваших пальцев';

  @override
  String get termsPolicy =>
      'Регистрируясь, вы соглашаетесь с Условиями обслуживания и Политикой конфиденциальности.';

  @override
  String get pleaseEnterEmail => 'Пожалуйста, введите ваш email';

  @override
  String get pleaseEnterPassword => 'Пожалуйста, введите пароль';

  @override
  String get pleaseEnterName => 'Пожалуйста, введите ваше имя';

  @override
  String get passwordShort => 'Пароль должен содержать не менее 6 символов';

  @override
  String get contractTooShort =>
      'Текст договора слишком короткий. Пожалуйста, введите не менее 50 символов.';

  @override
  String get contractValidator => 'Валидатор контрактов';

  @override
  String get analyzingContract => 'Анализ договора...';

  @override
  String get takeAMinute => 'Это может занять минуту';

  @override
  String get analyzeAnother => 'Анализировать другой';

  @override
  String get checkYourContract => 'Проверьте свой контракт';

  @override
  String get pasteContractInstruction =>
      'Вставьте текст вашего контракта ниже, чтобы получить юридический анализ на базе ИИ, выявить риски и недостающие пункты.';

  @override
  String get pasteContractHint => 'Вставьте текст контракта здесь...';

  @override
  String get analyzeContractButton => 'Анализировать контракт';

  @override
  String get detailsTooShort =>
      'Пожалуйста, предоставьте больше деталей (минимум 20 символов).';

  @override
  String get contractGenerator => 'Генератор контрактов';

  @override
  String get templatesAvailable => 'шаблонов доступно';

  @override
  String get selectedCategory => 'Выбранная категория';

  @override
  String get requirements => 'Требования';

  @override
  String get requirementsDescription =>
      'Опишите подробно, что вам нужно в этом контракте. Укажите имена, даты, суммы и любые особые условия.';

  @override
  String get requirementsHint =>
      'Например: Мне нужен договор купли-продажи на поставку 500 виджетов в Ташкент к следующей пятнице...';

  @override
  String get generateContractButton => 'Сгенерировать контракт';

  @override
  String get generatingContract => 'Генерация вашего контракта...';

  @override
  String get startOver => 'Начать заново';

  @override
  String get copySave => 'Копировать';

  @override
  String get contractCopied => 'Контракт скопирован в буфер обмена!';

  @override
  String get chats => 'Чаты';

  @override
  String get validations => 'Проверки';

  @override
  String get contracts => 'Договоры';

  @override
  String get noChatHistory => 'История чатов пуста.';

  @override
  String get noValidationHistory => 'История проверок пуста.';

  @override
  String get noGeneratedContracts => 'Нет созданных договоров.';

  @override
  String get messagesCount => 'сообщений';

  @override
  String get consultant => '📚 Юрист-консультант';

  @override
  String get riskManager => '🛡️ Риск-менеджер';

  @override
  String get memorandum => '⚖️ ЮРИДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ';

  @override
  String get quickAnswer => '⚡ Быстрый ответ';

  @override
  String get smalltalk => '💬 Просто пообщаться';

  @override
  String get criminalDefense => '⚖️ Адвокат (Защита)';

  @override
  String get criminalProsecution => '⚔️ Прокурор (Обвинение)';

  @override
  String get adminDefense => '🛡️ Адм. защита (Штрафы)';

  @override
  String get adminProcedure => '📋 Адм. процедуры';

  @override
  String get corporate => '🏢 Корпоративный юрист';

  @override
  String get commercial => '📜 Коммерческий юрист';

  @override
  String get startup => '� Юрист для стартапов';

  @override
  String get mergerAcquisition => '🤝 Слияния (M&A)';

  @override
  String get antitrust => '🛡️ Антимонопольный юрист';

  @override
  String get bankruptcy => '🏚️ Банкротство';

  @override
  String get procurement => '🏛️ Госзакупки';

  @override
  String get licensing => '� Лицензирование';

  @override
  String get regulatory => '🌐 Регуляторный комплаенс';

  @override
  String get tax => '🧾 Налоговый юрист';

  @override
  String get banking => '� Банковский юрист';

  @override
  String get securities => '� Ценные бумаги и IPO';

  @override
  String get insurance => '🛡️ Страховой юрист';

  @override
  String get debtCollection => '💸 Взыскание долгов';

  @override
  String get investorProtection => '�️ Защита инвесторов';

  @override
  String get crossBorder => '🌍 Трансграничные сделки';

  @override
  String get customs => '🚢 Таможенный юрист';

  @override
  String get realEstate => '🏠 Недвижимость';

  @override
  String get housing => '🏘️ Жилищное право (ЖКХ)';

  @override
  String get landDisputes => '🌾 Земельные споры';

  @override
  String get family => '👨‍👩‍👧 Семейный юрист';

  @override
  String get consumerProtection => '🛒 Защита прав потребителей';

  @override
  String get notary => '📜 Нотариус';

  @override
  String get hr => '👷 HR-юрист';

  @override
  String get workerProtection => '👷 Защита прав работника';

  @override
  String get complianceHr => '👥 HR-комплаенс';

  @override
  String get litigator => '🏛️ Судебный юрист';

  @override
  String get procedural => '📝 Процессуалист';

  @override
  String get arbitration => '🤝 Арбитраж';

  @override
  String get mediation => '🕊️ Медиация';

  @override
  String get enforcement => '⚡ Исполнение решений';

  @override
  String get deadlines => '⏳ Сроки и давность';

  @override
  String get forensicLegal => '🔬 Судебная экспертиза';

  @override
  String get constitutional => '🏛️ Конституционное право';

  @override
  String get ip => '💡 IP-юрист (Авторское)';

  @override
  String get digitalLaw => '💻 Цифровое право (IT)';

  @override
  String get legalAudit => '🚨 Юридический аудит';

  @override
  String get compliance => '�️ Общий комплаенс';

  @override
  String get environmental => '🌿 Экологическое право';

  @override
  String get docReview => '📄 Проверка документа';

  @override
  String get legalLetter => '✉️ Написать претензию';

  @override
  String get negotiator => '� Переговорщик';

  @override
  String get interviewPractice => '🎤 Интервьюер';

  @override
  String get analyst => '🧩 Аналитик';

  @override
  String get skeptic => '🔍 Скептик';

  @override
  String get strategist => '🤖 Стратег';

  @override
  String get judgeQuestions => '⚖️ Вопросы судьи';

  @override
  String get odds => '📊 Шансы на успех';

  @override
  String get whatIf => '🧪 Что если...';

  @override
  String get sources => 'Источники';

  @override
  String get copiedToClipboard => 'Скопировано в буфер обмена';

  @override
  String get aiLegalAssistant => 'ИИ Юридический ассистент';

  @override
  String get you => 'Вы';

  @override
  String get aiLawyer => 'ИИ Юрист';

  @override
  String get chooseSpecialist => 'Выберите специалиста';

  @override
  String get chooseExpertForConsultation =>
      'Выберите ИИ-эксперта по праву для консультации';

  @override
  String get enterLegalQuestion => 'Введите ваш юридический вопрос...';
}
