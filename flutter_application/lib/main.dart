import 'package:flutter/material.dart';
import 'package:flutter_application/src/app.dart';
import 'package:flutter_application/src/dashboard/user_dashboard.dart';
import 'package:flutter_application/src/groups/userGroups.dart';
import 'package:flutter_application/src/login-signup/loginsignup.dart';
import 'package:flutter_application/src/login-signup/signup.dart';
import 'package:flutter_application/src/login-signup/login.dart';
import 'package:flutter_application/src/login-signup/passwordReset.dart';
import 'package:flutter_application/src/dashboard/CreateWorkspace.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SharedPreferences prefs = await SharedPreferences.getInstance();


  runApp(MaterialApp(
    debugShowCheckedModeBanner: false,
    initialRoute: MyApp.routeName,
    routes: {
      Login.routeName: (context) => const Login(),
      Signup.routeName: (context) => const Signup(),
      MyApp.routeName: (context) => MyApp(token: prefs.getString('token'),),
      UserDashboard.routeName: (context) => const UserDashboard(),
      LoginSignup.routeName: (context) => const LoginSignup(),
      PasswordResetPage.routeName: (context) => PasswordResetPage(),
      CreateWorkspace.routeName: (context) => CreateWorkspace(userId: '6671c8362ffea49f3018bf61'),
      // Manually Implemented UserID for Raheem Sterling in Flutter Workspace for Debugging purposes
      UserGroup.routeName: (context) => const UserGroup(workspaceId: '667a22ad8f5ce812352bba01', userId: '667a2e4a8f5ce812352bba6f',),
      // AdminGroup.routeName: (context) => AdminGroup(workspaceId: '667a22ad8f5ce812352bba01', userId: ,),
    },
  ));
}
