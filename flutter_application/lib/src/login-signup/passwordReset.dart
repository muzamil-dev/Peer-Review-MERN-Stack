import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class PasswordResetPage extends StatelessWidget {
  static const routeName = '/passwordReset'; // Ensure you have this route defined

  final TextEditingController tokenController = TextEditingController();
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();

  PasswordResetPage({super.key});

  Future<void> resetPassword(BuildContext context, String token, String newPassword) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/resetPassword');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': token,
          'newPassword': newPassword,
        }),
      );

      if (response.statusCode == 200) {
        print('Password reset successful');
        Navigator.pushNamed(context, '/loginsignup');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password reset successful. Please login with your new password.')),
        );
      } else {
        final errorData = json.decode(response.body);
        print('Password reset failed: ${response.statusCode}, ${errorData['message']}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Password reset failed: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error: $err');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Reset Password',
          style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white, // Title color
            ), // Change text color here
        ),
        backgroundColor: const Color(0xFF004080),
        centerTitle: true,
      ),
      body: 
        Container(
          color: const Color(0xFF004080),
          child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextField(
                controller: tokenController,
                decoration: InputDecoration(
                  labelText: 'Token',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                  fillColor: Colors.grey[200],
                  filled: true,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: newPasswordController,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                  fillColor: Colors.grey[200],
                  filled: true,
                ),
                obscureText: true,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: confirmPasswordController,
                decoration: InputDecoration(
                  labelText: 'Confirm New Password',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none,
                  ),
                  fillColor: Colors.grey[200],
                  filled: true,
                ),
                obscureText: true,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  final token = tokenController.text;
                  final newPassword = newPasswordController.text;
                  final confirmPassword = confirmPasswordController.text;

                  if (newPassword.isEmpty || confirmPassword.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please fill in all fields')),
                    );
                    return;
                  }

                  if (newPassword == confirmPassword) {
                    resetPassword(context, token, newPassword);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Passwords do not match')),
                    );
                  }
                },
                child: const Text('Reset Password'),
              ),
            ],
          ),
        ),
      ), 
    );
  }
}
