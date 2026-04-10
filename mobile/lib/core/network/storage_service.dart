import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

abstract class StorageService {
  Future<String?> getToken();
  Future<void> setToken(String token);
  Future<void> removeToken();
  Future<void> saveUser(Map<String, dynamic> user);
  Future<Map<String, dynamic>?> getUser();
  Future<void> removeUser();
  Future<void> clearAll();
}

class StorageServiceImpl implements StorageService {
  final SharedPreferences sharedPreferences;

  StorageServiceImpl(this.sharedPreferences);

  @override
  Future<String?> getToken() async {
    return sharedPreferences.getString(AppConstants.tokenKey);
  }

  @override
  Future<void> setToken(String token) async {
    await sharedPreferences.setString(AppConstants.tokenKey, token);
  }

  @override
  Future<void> removeToken() async {
    await sharedPreferences.remove(AppConstants.tokenKey);
  }

  @override
  Future<void> saveUser(Map<String, dynamic> user) async {
    final userString = json.encode(user);
    await sharedPreferences.setString(AppConstants.userKey, userString);
  }

  @override
  Future<Map<String, dynamic>?> getUser() async {
    final userString = sharedPreferences.getString(AppConstants.userKey);
    if (userString != null) {
      try {
        return json.decode(userString) as Map<String, dynamic>;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  @override
  Future<void> removeUser() async {
    await sharedPreferences.remove(AppConstants.userKey);
  }

  @override
  Future<void> clearAll() async {
    await sharedPreferences.clear();
  }
}
