class ApiConstants {
  static const String baseUrl = 'https://lawyerai.uz';

  // Auth
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String me = '/api/auth/me';

  // Generator
  static const String generatorCategories = '/api/generator/categories';
  static const String generatorGenerate = '/api/generator/generate';
  static const String generatorHistory = '/api/generator/history';

  // Validator (Contract)
  static const String validatorAnalyze = '/api/validator/analyze';
  static const String validatorHistory = '/api/validator/history';

  // Document Validator
  static const String documentValidatorAnalyze =
      '/api/document-validator/analyze';
  static const String documentValidatorHistory =
      '/api/document-validator/history';

  // Chat
  static const String lawyerSessions = '/api/lawyer/sessions';
  static const String lawyerChat = '/api/lawyer/chat';

  // Organization
  static const String organization = '/api/organization/';
  static const String organizationUsers = '/api/organization/my/users';

  // Tasks
  static const String tasks = '/api/tasks/';

  // Calendar
  static const String calendar = '/api/calendar/';
}
