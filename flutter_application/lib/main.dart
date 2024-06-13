import 'package:flutter/material.dart';

import 'src/login-signup/signup.dart';
import 'src/login-signup/login.dart';

void main() async {
  runApp(MaterialApp(
    initialRoute: Login.routeName,
    routes: {
      Login.routeName: (context) => const Login(),
      Signup.routeName: (context) => const Signup(),
    },
  ));
}
