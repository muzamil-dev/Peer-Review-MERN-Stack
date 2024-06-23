import 'package:flutter/material.dart';
import 'package:flutter_application/src/app.dart';
import 'package:flutter_application/src/dashboard/admin_dashboard.dart';
import 'package:flutter_application/src/dashboard/user_dashboard.dart';
import 'package:flutter_application/src/login-signup/loginsignup.dart';
import 'package:flutter_application/src/login-signup/signup.dart';
import 'package:flutter_application/src/login-signup/login.dart';
import 'package:flutter_application/src/login-signup/passwordReset.dart';
import 'package:flutter_application/src/dashboard/CreateWorkspace.dart';

void main() {
  runApp(MaterialApp(
    debugShowCheckedModeBanner: false,
    initialRoute: MyApp.routeName,
    routes: {
      Login.routeName: (context) => const Login(),
      Signup.routeName: (context) => const Signup(),
      MyApp.routeName: (context) => const MyApp(),
      AdminDashboard.routeName: (context) => AdminDashboard(),
      UserDashboard.routeName: (context) => const UserDashboard(),
      LoginSignup.routeName: (context) => const LoginSignup(),
      PasswordResetPage.routeName: (context) => PasswordResetPage(),
      CreateWorkspace.routeName: (context) => CreateWorkspace(userId: '6671c8362ffea49f3018bf61'),
    },
  ));
}
