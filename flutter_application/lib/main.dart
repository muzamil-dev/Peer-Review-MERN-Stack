import 'package:flutter/material.dart';
import 'package:flutter_application/src/app.dart';
import 'package:flutter_application/src/dashboard/AdminDashboard.dart';
import 'package:flutter_application/src/dashboard/UserDashboard.dart';

import 'src/login-signup/signup.dart';
import 'src/login-signup/login.dart';

void main() async {
  runApp(MaterialApp(
    initialRoute: MyApp.routeName,
    routes: {
      Login.routeName: (context) => const Login(),
      Signup.routeName: (context) => const Signup(),
      MyApp.routeName: (context) => const MyApp(),
      AdminDashboard.routeName: (context) => const AdminDashboard(),
      UserDashboard.routeName: (context) => const UserDashboard(),
    },
  ));
}
