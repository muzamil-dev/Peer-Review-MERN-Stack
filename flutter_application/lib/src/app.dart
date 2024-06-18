import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';
import 'package:flutter_application/src/login-signup/loginsignup.dart';

/// The Widget that configures your application.
class MyApp extends StatelessWidget {
  const MyApp({
    super.key,
  });

  static const routeName = "/debug";

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PEER APP',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: Scaffold(
        appBar: const MainAppBar(title: "DEBUG PAGE VIEWER"),
        body: Center(
          child: Column(
            children: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/login");
                },
                child: const Text("LOGIN PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/signup");
                },
                child: const Text("SIGNUP PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/adminDashboard");
                },
                child: const Text("ADMIN DASHBOARD PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/userDashboard");
                },
                child: const Text("USER DASHBOARD PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/loginsignup");
                },
                child: const Text("Login Signup PAGE"),
              ),
            ],
          ),
        ),
      ),
      routes: {
        //'/login': (context) => LoginScreen(), // Add the LoginScreen route
        //'/signup': (context) => SignUpScreen(), // Add the SignUpScreen route
        //'/userDashboard': (context) => UserDashboardScreen(), // Add the UserDashboardScreen route
        // '/adminDashboard': (context) => AdminDashboardScreen(), // Uncomment and add AdminDashboardScreen route if necessary
        '/loginsignup': (context) => LoginSignup(), // Add the LoginSignupScreen route
      },
    );
    // Glue the SettingsController to the MaterialApp.
    //
    // The ListenableBuilder Widget listens to the SettingsController for changes.
    // Whenever the user updates their settings, the MaterialApp is rebuilt.
  }
}
