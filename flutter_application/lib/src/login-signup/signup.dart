import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';

/// The Widget that configures your application.
class Signup extends StatelessWidget {
  const Signup({
    super.key,
  });

  static const routeName = "/signup";

  void doSignup() {}

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
        appBar: MainAppBar(title: "Signup"),
        body: Padding(
          padding: EdgeInsets.all(15),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              TextField(
                obscureText: false,
                decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'Username',
                ),
              ),
              Padding(padding: EdgeInsets.all(5)),
              TextField(
                obscureText: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: 'Password',
                ),
              ),
              SizedBox(
                height: 5,
              ),
              ElevatedButton(
                style: ButtonStyle(
                  backgroundColor: WidgetStatePropertyAll<Color>(
                    Colors.blue,
                  ),
                ),
                onPressed: null,
                child: Text(
                  "Login",
                  style: TextStyle(color: Colors.white, fontSize: 20),
                ),
              ),
            ],
          ),
        ));
  }
}
