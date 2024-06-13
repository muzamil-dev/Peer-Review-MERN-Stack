import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_application/components/MainAppBar.dart';

/// The Widget that configures your application.
class Login extends StatelessWidget {
  const Login({
    super.key,
  });

  static const routeName = "/login";

  void doLogin() {}

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
        appBar: MainAppBar(title: "Login"),
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
