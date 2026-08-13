import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = false;

  User? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;

  final _api = ApiService();

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('glamcart_token');
    if (token == null) return;
    try {
      final res = await _api.getMe();
      _user = User.fromJson(res.data['user'] ?? res.data);
      notifyListeners();
    } catch (_) {
      prefs.remove('glamcart_token');
    }
  }

  Future<void> login(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final res = await _api.login(email, password);
      final prefs = await SharedPreferences.getInstance();
      prefs.setString('glamcart_token', res.data['token']);
      _user = User.fromJson(res.data['user']);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> register(String name, String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final res = await _api.register(name, email, password);
      final prefs = await SharedPreferences.getInstance();
      prefs.setString('glamcart_token', res.data['token']);
      _user = User.fromJson(res.data['user']);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    prefs.remove('glamcart_token');
    _user = null;
    notifyListeners();
  }

  Future<void> forgotPassword(String email) async {
    _loading = true;
    notifyListeners();
    try {
      await _api.forgotPassword(email);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> resetPassword(String token, String password) async {
    _loading = true;
    notifyListeners();
    try {
      await _api.resetPassword(token, password);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
