import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../main.dart';
import 'login_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  // Step 1: request link
  final _emailCtrl = TextEditingController();
  // Step 2: reset password
  final _tokenCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  final _step1Key = GlobalKey<FormState>();
  final _step2Key = GlobalKey<FormState>();

  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _linkSent = false;   // true after step 1 success
  bool _success = false;    // true after password reset
  String? _error;

  static final _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  static final _passRe = RegExp(r'^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$');

  @override
  void dispose() {
    _emailCtrl.dispose();
    _tokenCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendLink() async {
    if (!_step1Key.currentState!.validate()) return;
    setState(() => _error = null);
    try {
      await context.read<AuthProvider>().forgotPassword(_emailCtrl.text.trim());
      if (!mounted) return;
      setState(() => _linkSent = true);
    } catch (e) {
      setState(() => _error = ApiService.getErrorMessage(e));
    }
  }

  Future<void> _resetPassword() async {
    if (!_step2Key.currentState!.validate()) return;
    setState(() => _error = null);
    try {
      await context.read<AuthProvider>().resetPassword(
            _tokenCtrl.text.trim(),
            _newPassCtrl.text,
          );
      if (!mounted) return;
      setState(() => _success = true);
    } catch (e) {
      setState(() => _error = ApiService.getErrorMessage(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _success ? _buildSuccess() : _linkSent ? _buildStep2(loading) : _buildStep1(loading),
        ),
      ),
    );
  }

  // ─── Step 1: Enter email ───────────────────────────────────────────────────
  Widget _buildStep1(bool loading) {
    return Form(
      key: _step1Key,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          const Text('GlamCart', style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: kPink)),
          const SizedBox(height: 8),
          const Text('Forgot Password?',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: kDark)),
          const SizedBox(height: 8),
          const Text(
            'Enter your registered email and we\'ll send you a reset link.',
            style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 36),

          if (_error != null) ...[
            _errorBox(_error!),
            const SizedBox(height: 16),
          ],

          TextFormField(
            controller: _emailCtrl,
            decoration: const InputDecoration(
              labelText: 'Email address',
              prefixIcon: Icon(Icons.email_outlined, color: Colors.grey),
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => loading ? null : _sendLink(),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Please enter your email';
              if (!_emailRe.hasMatch(v.trim())) return 'Please enter a valid email address';
              return null;
            },
          ),

          const SizedBox(height: 28),

          ElevatedButton(
            onPressed: loading ? null : _sendLink,
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: loading
                ? const SizedBox(height: 20, width: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Send Reset Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),

          const SizedBox(height: 20),
          Center(
            child: GestureDetector(
              onTap: () => Navigator.pushReplacement(
                  context, MaterialPageRoute(builder: (_) => const LoginScreen())),
              child: const Text('Back to Login',
                  style: TextStyle(color: kPink, fontWeight: FontWeight.w600, fontSize: 14)),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ─── Step 2: Enter token + new password ───────────────────────────────────
  Widget _buildStep2(bool loading) {
    return Form(
      key: _step2Key,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),

          // Success banner (link sent)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.shade200),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.mark_email_read_outlined, color: Colors.green.shade600, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Reset link sent!',
                          style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 4),
                      Text(
                        'A reset email was sent to ${_emailCtrl.text.trim()}. '
                        'Open the email and copy the Reset Token shown in the pink box.',
                        style: TextStyle(color: Colors.green.shade700, fontSize: 13, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 28),
          const Text('Set New Password',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kDark)),
          const SizedBox(height: 6),
          const Text('Copy the Reset Token from the pink box in the email, then enter your new password.',
              style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.5)),

          const SizedBox(height: 24),

          if (_error != null) ...[
            _errorBox(_error!),
            const SizedBox(height: 16),
          ],

          // Token field
          TextFormField(
            controller: _tokenCtrl,
            decoration: const InputDecoration(
              labelText: 'Reset Token',
              hintText: 'Paste token from email',
              prefixIcon: Icon(Icons.vpn_key_outlined, color: Colors.grey),
            ),
            textInputAction: TextInputAction.next,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter the reset token' : null,
          ),
          const SizedBox(height: 16),

          // New password
          TextFormField(
            controller: _newPassCtrl,
            obscureText: _obscureNew,
            decoration: InputDecoration(
              labelText: 'New Password',
              hintText: 'Min 8 chars, uppercase, number, symbol',
              prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
              suffixIcon: IconButton(
                icon: Icon(_obscureNew ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    color: Colors.grey),
                onPressed: () => setState(() => _obscureNew = !_obscureNew),
              ),
            ),
            textInputAction: TextInputAction.next,
            validator: (v) {
              if (v == null || v.isEmpty) return 'Please enter a new password';
              if (!_passRe.hasMatch(v))
                return 'Min 8 chars with uppercase, number & special character';
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Confirm password
          TextFormField(
            controller: _confirmPassCtrl,
            obscureText: _obscureConfirm,
            decoration: InputDecoration(
              labelText: 'Confirm Password',
              prefixIcon: const Icon(Icons.lock_outline, color: Colors.grey),
              suffixIcon: IconButton(
                icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    color: Colors.grey),
                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
              ),
            ),
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => loading ? null : _resetPassword(),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Please confirm your password';
              if (v != _newPassCtrl.text) return 'Passwords do not match';
              return null;
            },
          ),

          const SizedBox(height: 28),

          ElevatedButton(
            onPressed: loading ? null : _resetPassword,
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: loading
                ? const SizedBox(height: 20, width: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Update Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  Widget _buildSuccess() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 60),
        Center(
          child: Container(
            width: 80, height: 80,
            decoration: BoxDecoration(color: Colors.green.shade100, shape: BoxShape.circle),
            child: Icon(Icons.check_circle_outline_rounded, color: Colors.green.shade600, size: 44),
          ),
        ),
        const SizedBox(height: 28),
        const Text('Password Changed!',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: kDark)),
        const SizedBox(height: 12),
        const Text(
          'Your password has been changed successfully.\nPlease login again with your new password.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.6),
        ),
        const SizedBox(height: 40),
        ElevatedButton(
          onPressed: () => Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (route) => false,
          ),
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
          child: const Text('Login with New Password',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _errorBox(String msg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red.shade600, size: 16),
            const SizedBox(width: 8),
            Expanded(child: Text(msg, style: TextStyle(color: Colors.red.shade700, fontSize: 13))),
          ],
        ),
      );
}
