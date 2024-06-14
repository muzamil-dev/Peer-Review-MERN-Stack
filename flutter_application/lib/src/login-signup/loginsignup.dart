import 'package:flutter/material.dart';
import 'package:flutter_application/components/MainAppBar.dart';

class LoginSignup extends StatefulWidget {
  const LoginSignup({super.key});

  static const routeName = '/loginsignup';

  @override
  _LoginSignupState createState() => _LoginSignupState();
}

class _LoginSignupState extends State<LoginSignup> {
  PageController _pageController = PageController();
  int _selectedPage = 0;

  void _togglePage(int page) {
    setState(() {
      _selectedPage = page;
    });
    _pageController.animateToPage(
      page,
      duration: Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MainAppBar(
        title: 'Auth Page',
      ),
      body: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: () => _togglePage(0),
                child: Container(
                  padding: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: _selectedPage == 0
                            ? Colors.blue
                            : Colors.transparent,
                        width: 2,
                      ),
                    ),
                  ),
                  child: Text(
                    'Login',
                    style: TextStyle(
                      fontSize: 18,
                      color: _selectedPage == 0 ? Colors.blue : Colors.grey,
                    ),
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => _togglePage(1),
                child: Container(
                  padding: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: _selectedPage == 1
                            ? Colors.blue
                            : Colors.transparent,
                        width: 2,
                      ),
                    ),
                  ),
                  child: Text(
                    'Sign Up',
                    style: TextStyle(
                      fontSize: 18,
                      color: _selectedPage == 1 ? Colors.blue : Colors.grey,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _selectedPage = index;
                });
              },
              children: [
                LoginScreen(),
                SignUpScreen(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class LoginScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TextField(
            decoration: InputDecoration(labelText: 'Email'),
          ),
          TextField(
            decoration: InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              // Handle login logic
            },
            child: Text('Login'),
          ),
        ],
      ),
    );
  }
}

class SignUpScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TextField(
            decoration: InputDecoration(labelText: 'Email'),
          ),
          TextField(
            decoration: InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          TextField(
            decoration: InputDecoration(labelText: 'Confirm Password'),
            obscureText: true,
          ),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              // Handle signup logic
            },
            child: Text('Sign Up'),
          ),
        ],
      ),
    );
  }
}
