import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application/src/dashboard/admin_dashboard.dart';
import 'dart:ui'; // for BackdropFilter
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_svg/flutter_svg.dart';

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
        iconTheme: const IconThemeData(
          color: Colors.white,
        ),
        backgroundColor: const Color(0xFF004080),
        centerTitle: true,
      ),
      body: Container(
        color: const Color(0xFF004080), // Background color
        child: Column(
          children: [
            const Text(
              'Welcome to',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white, // Title color
              ), // Change text color here
            ),
            const SizedBox(height: 10),
            // Rate My Peer Logo
            SvgPicture.asset(
              'assets/images/RateMyPeer.svg',
              width: 50,
              height: 50,
            ),
            const SizedBox(height: 10),
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
                      'Sign in',
                      style: TextStyle(
                        fontSize: 18,
                        color: _selectedPage == 0
                            ? Colors.white
                            : const Color.fromARGB(255, 234, 222, 222),
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
                        color: _selectedPage == 1
                            ? Colors.white
                            : const Color.fromARGB(255, 234, 222, 222),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 5), // Add space between tabs and title
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
  final storage = const FlutterSecureStorage();
  final apiInstance = Api();

  Future<String?> getAccessToken() async {
    return await storage.read(key: 'token');
  }

  Future<void> loginUser(
      BuildContext context, String email, String password) async {
    try {
      const url = "/users/login";
      final response = await apiInstance.api.post(
        url,
        data: jsonEncode({
          'email': email.toLowerCase(),
          'password': password,
        }),
      );
      if (response.statusCode == 200) {
        final responseData = response.data;
        var userToken = responseData['accessToken'];
        await storage.write(key: 'accessToken', value: userToken);

        // Retrieves refresh token
        String? jwtValue;
        final setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader != null) {
          for (final cookie in setCookieHeader) {
            final parts = cookie.split(';');
            final cookieName = parts[0].split('=')[0];
            if (cookieName == 'jwt') {
              jwtValue = parts[0].split('=')[1];
              break;
            }
          }
        }

        if (jwtValue != null) {
          await storage.write(key: 'refreshToken', value: jwtValue);
        } else {
          // Handle case where jwt cookie is not found
          print('jwt cookie not found');
        }

        // Navigate to dashboard
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (context) => AdminDashboard(
                      token: userToken,
                    ))); // Adjust the route name as needed
      } else {
        // Login failed
        final errorData = json.decode(response.data);
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
    const url = '/users/requestPasswordReset';

    try {
      final response = await apiInstance.api.post(url,
          data: jsonEncode({
            'email': email,
          }));

      if (response.statusCode == 201) {
        print('Password reset email sent');
        Navigator.pushNamed(context, '/passwordReset');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password reset email sent')),
        );
      } else {
        final errorData = json.decode(response.data);
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
                hintText: 'Email',
                hintStyle: const TextStyle(fontSize: 17),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: const BorderSide(color: Colors.blue, width: 3),
                ),
                prefixIcon: const Icon(Icons.email),
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            child: TextField(
              controller: passwordController,
              decoration: InputDecoration(
                hintText: 'Password',
                hintStyle: const TextStyle(fontSize: 17),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: BorderSide.none),
                fillColor: Colors.white,
                filled: true,
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: const BorderSide(color: Colors.blue, width: 3),
                ),
                prefixIcon: const Icon(Icons.password),
              ),
              obscureText: true,
            ),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            onPressed: () {
              // Handle login logic
              final email = emailController.text;
              final password = passwordController.text;
              loginUser(context, email, password);
            },
            child: const SizedBox(
              width: 110,
              child: Center(
                child: Text(
                  'Sign in',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
              ),
            ),
          ),
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
                                children: [
                                  const Text(
                                    'Reset Password',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 15),
                                  TextField(
                                    controller: resetEmailController,
                                    decoration: InputDecoration(
                                      labelText: 'Enter Your Email',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(18),
                                        borderSide: BorderSide.none,
                                      ),
                                      labelStyle:
                                          const TextStyle(color: Colors.black),
                                      fillColor: Colors.grey[200],
                                      filled: true,
                                    ),
                                  ),
                                  const SizedBox(height: 15),
                                  ElevatedButton(
                                    onPressed: () {
                                      // Handle password reset logic
                                      // Send password reset email
                                      final email = resetEmailController.text;
                                      requestPasswordReset(context, email);
                                    },
                                    style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.green),
                                    child: const Text(
                                      'Submit',
                                      style: TextStyle(color: Colors.white),
                                    ),
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
              style: TextStyle(color: Colors.white, fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }
}

class SignUpScreen extends StatefulWidget {
  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final TextEditingController firstNameController = TextEditingController();
  final TextEditingController lastNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();
  final TextEditingController tokenController = TextEditingController();
  final apiInstance = Api();
  String? accessToken;
  final storage = const FlutterSecureStorage();
  String invalidPasswordMessage = '';
  bool showInvalidWidget = false;
  final _formKey = GlobalKey<FormState>();
  bool showPassword = false;
  bool showConfirmPassword = false;
  bool obscurePassword = true;
  bool obscureConfirmPassword = true;

  Future<void> userSignUp(
      BuildContext context,
      String firstName,
      String lastName,
      String email,
      String password,
      String confirmPassword) async {
    const url = '/users/signup';

    try {
      final response = await apiInstance.api.post(
        url,
        data: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'email': email.toLowerCase(),
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        print("Sign Up Successful. Please verify your email.");
        _showVerificationDialog(context);
      } else {
        final errorData = json.decode(response.data);
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
          title: const Text('Email Verification'),
          content: TextField(
            controller: tokenController,
            decoration:
                const InputDecoration(labelText: 'Enter verification token'),
            style: const TextStyle(color: Colors.black),
          ),
          actions: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                TextButton(
                  style: TextButton.styleFrom(backgroundColor: Colors.green),
                  onPressed: () {
                    verifyEmail(context, tokenController.text);
                  },
                  child: const Text(
                    'Verify',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
                TextButton(
                  style: TextButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Future<void> verifyEmail(BuildContext context, String token) async {
    const url = '/users/verifyEmail';

    try {
      final response = await apiInstance.api.post(
        url,
        data: jsonEncode({
          'token': token,
        }),
      );

      if (response.statusCode == 201) {
        print("Success");
        Navigator.pop(context); // Close the dialog
        Navigator.push(
            context,
            MaterialPageRoute(
                builder: (context) =>
                    // AdminDashboard(token: storage.read(key: "accessToken") as String)
                    const LoginSignup())); // Navigate to dashboard
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please Log In')),
        );
      } else {
        final errorData = response.data;
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
        const SnackBar(content: Text('Error verifying email.')),
      );
    }
  }

  bool isValidForm(GlobalKey key) {
    if (_formKey.currentState!.validate() == false) {
      print("Sign Up Validation Failed!");
      return false;
    }
    return true;
  }

  bool invalidPasswordFormat(TextEditingController passwordController) {
    String password = passwordController.text;

    // Regex Pattern Must Contain One Uppercase, Lowercase, Special, Number, 8 Chars
    String pattern =
        r'^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#\$&*~]).{8,}$';

    RegExp regExp = RegExp(pattern);
    return (regExp.hasMatch(password)) ? false : true;
  }

  Widget validationIcon(String validationKey) {
    String pattern;
    RegExp regExp;
    String password = passwordController.text;

    if (validationKey == "upper-case") {
      pattern = r'^(?=.*?[A-Z])';
    } else if (validationKey == "lower-case") {
      pattern = r'^(?=.*?[a-z])';
    } else if (validationKey == "special") {
      pattern = r'^(?=.*?[!@#\$&*~])';
    } else if (validationKey == "number") {
      pattern = r'^(?=.*?[0-9])';
    } else {
      pattern = r'^.{8,}$';
    }

    regExp = RegExp(pattern);
    if (regExp.hasMatch(password)) {
      return const Icon(
        Icons.check_circle,
        color: Colors.green,
      );
    } else {
      return const Icon(
        Icons.cancel,
        color: Colors.red,
      );
    }
  }

  Widget showPasswordRequirements() {
    if (showInvalidWidget) {
      return Column(
        children: [
          Container(
            padding: EdgeInsets.all(8.0),
            decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFF004080), width: 1),
                borderRadius: BorderRadius.circular(8.0)),
            child: Column(
              children: [
                const Text(
                  "Password Requirements:",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Row(
                  children: [
                    validationIcon("upper-case"),
                    const SizedBox(
                      width: 10,
                    ),
                    const Text("Must Contain One Uppercase Letter"),
                  ],
                ),
                Row(
                  children: [
                    validationIcon("lower-case"),
                    const SizedBox(
                      width: 10,
                    ),
                    const Text("Must Contain One Lowercase Letter"),
                  ],
                ),
                Row(
                  children: [
                    validationIcon("special"),
                    const SizedBox(
                      width: 10,
                    ),
                    const Text("Must Contain One Special Character"),
                  ],
                ),
                Row(
                  children: [
                    validationIcon("number"),
                    const SizedBox(
                      width: 10,
                    ),
                    const Text("Must Contain One Number"),
                  ],
                ),
                Row(
                  children: [
                    validationIcon("character-length"),
                    const SizedBox(
                      width: 10,
                    ),
                    const Text("Must Contain Atleast 8 Characters"),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(
            height: 15,
          ),
        ],
      );
    } else {
      return const SizedBox();
    }
  }

  Widget showEyeIcon(bool password) {
    if (password) {
      return const Icon(
        CupertinoIcons.eye_slash,
        color: Colors.black,
      );
    }
    return const Icon(
      CupertinoIcons.eye,
      color: Colors.black,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextFormField(
                  controller: firstNameController,
                  decoration: InputDecoration(
                    hintText: 'First Name',
                    hintStyle: const TextStyle(fontSize: 17),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none),
                    fillColor: Colors.white,
                    filled: true,
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide:
                          const BorderSide(color: Colors.blue, width: 3),
                    ),
                    errorStyle: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Please Enter a Non-Empty Field";
                    }
                    return null;
                  },
                ),
              ),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextFormField(
                  controller: lastNameController,
                  decoration: InputDecoration(
                    hintText: 'Last Name',
                    hintStyle: const TextStyle(fontSize: 17),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none),
                    fillColor: Colors.white,
                    filled: true,
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide:
                          const BorderSide(color: Colors.blue, width: 3),
                    ),
                    errorStyle: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Please Enter a Non-Empty Field";
                    }
                    return null;
                  },
                ),
              ),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextFormField(
                  controller: emailController,
                  decoration: InputDecoration(
                    hintText: "Email",
                    hintStyle: const TextStyle(fontSize: 17),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none),
                    fillColor: Colors.white,
                    filled: true,
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide:
                          const BorderSide(color: Colors.blue, width: 3),
                    ),
                    prefixIcon: const Icon(Icons.email),
                    errorStyle: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                  maxLines: 1,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Please Enter a Non-Empty Field";
                    }
                    return null;
                  },
                ),
              ),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextFormField(
                  controller: passwordController,
                  decoration: InputDecoration(
                    hintText: 'Password',
                    hintStyle: const TextStyle(fontSize: 17),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none),
                    fillColor: Colors.white,
                    filled: true,
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide:
                          const BorderSide(color: Colors.blue, width: 3),
                    ),
                    prefixIcon: const Icon(Icons.password),
                    suffixIcon: IconButton(
                      onPressed: () {
                        setState(() {
                          showPassword = !showPassword;
                          obscurePassword = !obscurePassword;
                        });
                      },
                      icon: showEyeIcon(showPassword),
                    ),
                    errorStyle: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                  obscureText: obscurePassword,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Please Enter a Non-Empty Field";
                    } else if (invalidPasswordFormat(passwordController)) {
                      setState(() {
                        showInvalidWidget = true;
                      });
                      return "Invalid Password Format";
                    }
                    setState(() {
                      showInvalidWidget = false;
                    });
                    return null;
                  },
                ),
              ),
              showPasswordRequirements(),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextFormField(
                  controller: confirmPasswordController,
                  decoration: InputDecoration(
                    hintText: 'Confirm Password',
                    hintStyle: const TextStyle(fontSize: 17),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide: BorderSide.none),
                    fillColor: Colors.white,
                    filled: true,
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(18),
                      borderSide:
                          const BorderSide(color: Colors.blue, width: 3),
                    ),
                    prefixIcon: const Icon(Icons.password),
                    suffixIcon: IconButton(
                      onPressed: () {
                        setState(() {
                          showConfirmPassword = !showConfirmPassword;
                          obscureConfirmPassword = !obscureConfirmPassword;
                        });
                      },
                      icon: showEyeIcon(showConfirmPassword),
                    ),
                    errorStyle: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                        fontWeight: FontWeight.bold),
                  ),
                  obscureText: obscureConfirmPassword,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Please Enter a Non-Empty Field";
                    }
                    if (value != passwordController.text) {
                      return "Password and Confirm Password Do Not Match";
                    }
                    return null;
                  },
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                onPressed: () {
                  // Handle Validation Logic
                  if (!isValidForm(_formKey)) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text("Sign Up Failed!"),
                    ));
                    return;
                  }
                  // Handle signup logic
                  final firstName = firstNameController.text;
                  final lastName = lastNameController.text;
                  final email = emailController.text;
                  final password = passwordController.text;
                  final confirmPassword = confirmPasswordController.text;
                  userSignUp(context, firstName, lastName, email, password,
                      confirmPassword);
                },
                child: const SizedBox(
                  width: 110,
                  child: Center(
                    child: Text(
                      'Sign Up',
                      style: TextStyle(color: Colors.white, fontSize: 18),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
