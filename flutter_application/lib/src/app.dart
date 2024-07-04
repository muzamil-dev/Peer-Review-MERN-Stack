import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';
import 'package:flutter_application/src/login-signup/loginsignup.dart';

/// The Widget that configures your application.
class MyApp extends StatelessWidget {
  final token;

  const MyApp({
    super.key,
    required this.token,
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
        appBar: const MainAppBar(
            title: "DEBUG PAGE VIEWER", backgroundColor: Color(0xFF9bc4bc)),
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
                  Navigator.pushNamed(context, "/loginsignup");
                },
                child: const Text("Login Signup PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/passwordReset");
                },
                child: const Text("Password Reset PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/userGroups");
                },
                child: const Text("USER GROUPS PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/adminGroups");
                },
                child: const Text("ADMIN GROUPS PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/createForm");
                },
                child: const Text("CREATE FORMS PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/editForm");
                },
                child: const Text("EDIT FORMS PAGE"),
              ),
              ElevatedButton(
                  onPressed: () {
                    Navigator.pushNamed(context, "/getAssignments");
                  },
                  child: const Text("GET ASSIGNMENTS PAGE")),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/userDashboard");
                },
                child: const Text("USER DASHBOARD PAGE"),
              ),
            ],
          ),
        ),
      ),
      // - - - Uncomment this line for Production
      // (JwtDecoder.isExpired(token) == false)? AdminDashboard(token: token): const LoginSignup(),
      routes: {
        //'/login': (context) => LoginScreen(), // Add the LoginScreen route
        //'/signup': (context) => SignUpScreen(), // Add the SignUpScreen route
        //'/userDashboard': (context) => UserDashboardScreen(), // Add the UserDashboardScreen route
        // '/adminDashboard': (context) => AdminDashboardScreen(), // Uncomment and add AdminDashboardScreen route if necessary
        '/loginsignup': (context) =>
            const LoginSignup(), // Add the LoginSignupScreen route
      },
    );
    // Glue the SettingsController to the MaterialApp.
    //
    // The ListenableBuilder Widget listens to the SettingsController for changes.
    // Whenever the user updates their settings, the MaterialApp is rebuilt.
  }
}
