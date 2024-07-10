import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_application/src/dashboard/admin_dashboard.dart';
import 'dart:ui'; // for BackdropFilter
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LoginSignup extends StatefulWidget {
  const LoginSignup({super.key});

  static const routeName = '/loginsignup';

  @override
  _LoginSignupState createState() => _LoginSignupState();
}

class _LoginSignupState extends State<LoginSignup> {
  final PageController _pageController = PageController();
  int _selectedPage = 0;

  void _togglePage(int page) {
    setState(() {
      _selectedPage = page;
    });
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Welcome!',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white, // Title color
          ), // Change text color here
        ),
        backgroundColor: Color(0xFF004080),
        centerTitle: true,
      ),
      body: Container(
        color: Color(0xFF004080), // Background color
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: () => _togglePage(0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: 10, horizontal: 20),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: _selectedPage == 0
                              ? Colors.white
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                    ),
                    child: Text(
                      'Login',
                      style: TextStyle(
                        fontSize: 18,
                        color: _selectedPage == 0 ? Colors.white : Colors.grey,
                      ),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => _togglePage(1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: 10, horizontal: 20),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: _selectedPage == 1
                              ? Colors.white
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                    ),
                    child: Text(
                      'Sign Up',
                      style: TextStyle(
                        fontSize: 18,
                        color: _selectedPage == 1 ? Colors.white : Colors.grey,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 10), // Add space between tabs and title
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _selectedPage = index;
                  });
                },
                children: [
                  SingleChildScrollView(
                    child: Column(
                      children: [
                        LoginScreen(),
                      ],
                    ),
                  ),
                  SingleChildScrollView(
                    child: Column(
                      children: [
                        SignUpScreen(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController resetEmailController = TextEditingController();
  late SharedPreferences prefs;

  @override
  void initState() {
    super.initState();
    initSharedPref();
  }

// Allows for Persistent Storage of JWT Token
  void initSharedPref() async {
    prefs = await SharedPreferences.getInstance();
  }

  Future<void> loginUser(
      BuildContext context, String email, String password) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/login');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        var userToken = responseData['accessToken'];
        prefs.setString('token', userToken);

        // Navigate to dashboard
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (context) => AdminDashboard(
                    token: userToken))); // Adjust the route name as needed
      } else {
        // Login failed
        final errorData = json.decode(response.body);
        print('Login failed: ${response.statusCode}, ${errorData['message']}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error: $err');
    }
  }

  Future<void> requestPasswordReset(BuildContext context, String email) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/requestPasswordReset');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
        }),
      );

      if (response.statusCode == 200) {
        print('Password reset email sent');
        Navigator.pushNamed(context, '/passwordReset');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Password reset email sent')),
        );
      } else {
        final errorData = json.decode(response.body);
        print(
            'Request failed: ${response.statusCode}, ${errorData['message']}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Request failed: \n${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error: $err');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
                prefixIcon: const Icon(Icons.email),
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: passwordController,
              decoration: InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
                prefixIcon: const Icon(Icons.password),
              ),
              obscureText: true,
            ),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: () {
              // Handle login logic
              final email = emailController.text;
              final password = passwordController.text;
              loginUser(context, email, password);
            },
            child: const Text('Login'),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (BuildContext context) {
                  return Dialog(
                    backgroundColor: Colors.transparent,
                    child: GestureDetector(
                      onTap: () {
                        Navigator.of(context).pop();
                      },
                      child: Stack(
                        children: [
                          BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 0.0, sigmaY: 0.0),
                            child: Container(
                              decoration: BoxDecoration(
                                //color: Colors.black.withOpacity(0.5),
                                borderRadius: BorderRadius.circular(20),
                              ),
                            ),
                          ),
                          SingleChildScrollView(
                            child: Container(
                              padding: const EdgeInsets.all(20),
                              margin: const EdgeInsets.symmetric(
                                  horizontal: 40, vertical: 160),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text(
                                    'Reset Password',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  TextField(
                                    controller: resetEmailController,
                                    decoration: InputDecoration(
                                      labelText: 'Enter your email',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(18),
                                        borderSide: BorderSide.none,
                                      ),
                                      fillColor: Colors.grey[200],
                                      filled: true,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  ElevatedButton(
                                    onPressed: () {
                                      // Handle password reset logic
                                      // Send password reset email
                                      final email = resetEmailController.text;
                                      requestPasswordReset(context, email);
                                    },
                                    child: const Text('Submit'),
                                  ),
                                ],
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                  );
                },
              );
            },
            child: const Text(
              'Forgot Password?',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class SignUpScreen extends StatelessWidget {
  final TextEditingController firstNameController = TextEditingController();
  //final TextEditingController middleNameController = TextEditingController();
  final TextEditingController lastNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();
  final TextEditingController tokenController = TextEditingController();

  Future<void> userSignUp(
      BuildContext context,
      String firstName,
      String lastName,
      String email,
      String password,
      String confirmPassword) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/signup');

    try {
      // Validation Check for Password and Confirm Password
      if (password != confirmPassword) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text(
                  'SignUp Failed: \nPassword and Confirm Password Do Not Match.')),
        );
        return;
      }

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        print("Sign Up Successful. Please verify your email.");
        _showVerificationDialog(context);
      } else {
        final errorData = json.decode(response.body);
        print("SignUp Failed: ${response.statusCode}, ${errorData['message']}");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('SignUp Failed: \n${errorData['message']}')),
        );
      }
    } catch (err) {
      print("Error: $err");
    }
  }

  void _showVerificationDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Email Verification'),
          content: TextField(
            controller: tokenController,
            decoration: InputDecoration(labelText: 'Enter verification token'),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                verifyEmail(context, tokenController.text);
              },
              child: Text('Verify'),
            ),
          ],
        );
      },
    );
  }

  Future<void> verifyEmail(BuildContext context, String token) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/verifyEmail');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': token,
        }),
      );

      if (response.statusCode == 200) {
        Navigator.pop(context); // Close the dialog
        Navigator.pushNamed(
            context, '/adminDashboard'); // Navigate to dashboard
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Email verified successfully.')),
        );
      } else {
        final errorData = json.decode(response.body);
        print(
            "Verification Failed: ${response.statusCode}, ${errorData['message']}");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Verification Failed: \n${errorData['message']}')),
        );
      }
    } catch (err) {
      print("Error: $err");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error verifying email.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: firstNameController,
              decoration: InputDecoration(
                labelText: 'First Name',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: lastNameController,
              decoration: InputDecoration(
                labelText: 'Last Name',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: emailController,
              decoration: InputDecoration(
                hintText: "Email",
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
                prefixIcon: const Icon(Icons.email),
              ),
              maxLines: 1,
            ),
          ),
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: passwordController,
              decoration: InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
                prefixIcon: const Icon(Icons.password),
              ),
              obscureText: true,
            ),
          ),
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: confirmPasswordController,
              decoration: InputDecoration(
                labelText: 'Confirm Password',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
                prefixIcon: const Icon(Icons.password),
              ),
              obscureText: true,
            ),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: () {
              // Handle signup logic
              final firstName = firstNameController.text;
              final lastName = lastNameController.text;
              final email = emailController.text;
              final password = passwordController.text;
              final confirmPassword = confirmPasswordController.text;
              userSignUp(context, firstName, lastName, email, password,
                  confirmPassword);
            },
            child: const Text('Sign Up'),
          ),
        ],
      ),
    );
  }
}
