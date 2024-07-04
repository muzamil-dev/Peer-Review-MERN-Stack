import 'package:flutter/material.dart';
import 'package:flutter_application/src/app.dart';
import 'package:flutter_application/src/dashboard/user_dashboard.dart';
import 'package:flutter_application/src/forms/create_form.dart';
import 'package:flutter_application/src/forms/get_forms.dart';
import 'package:flutter_application/src/forms/edit_form.dart';
import 'package:flutter_application/src/groups/adminGroups.dart';
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
      MyApp.routeName: (context) => MyApp(
            token: prefs.getString('token'),
          ),
      LoginSignup.routeName: (context) => const LoginSignup(),
      PasswordResetPage.routeName: (context) => PasswordResetPage(),
      CreateWorkspace.routeName: (context) =>
          CreateWorkspace(userId: '6671c8362ffea49f3018bf61'),
      // Manually Implemented User Groups Page for Raheem Sterling in Flutter Workspace for Debugging purposes
      UserGroup.routeName: (context) => const UserGroup(
            workspaceId: '667a22ad8f5ce812352bba01',
            userId: '667a2e4a8f5ce812352bba6f',
          ),
      // Manually Added Admin Groups Page route in Flutter Workspace for debugging purposes
      AdminGroup.routeName: (context) => const AdminGroup(
            workspaceId: '667a22ad8f5ce812352bba01',
            userId: '6671c8362ffea49f3018bf61',
          ),
      // Manually Added Create Forms Page for Debugging purposes. H alkhateeb
      CreateForm.routeName: (context) => const CreateForm(
          workspaceId: '667b32c640553ebab619b4fc',
          userId: '6671c8362ffea49f3018bf61'),
      GetAssignments.routeName: (context) => const GetAssignments(
          workspaceId: '667b32c640553ebab619b4fc',
          userId: '6671c8362ffea49f3018bf61'),
      // Manually Added Edit Forms Page for Debugging Purposes, User: Hashim DB
      EditForm.routeName: (context) => const EditForm(
          assignmentId: '6686edbc34ce67fd267800c0',
          workspaceId: '667b32c640553ebab619b4fc',
          userId: '6671c8362ffea49f3018bf61'),
      // User Dashboard Page for Raheem Sterling
      UserDashboard.routeName: (context) => const UserDashboard(userId: '667a2e4a8f5ce812352bba6f', workspaceId: '667b32c640553ebab619b4fc',),
    },
  ));
}

// JGMP-ZRFB-PKMX
