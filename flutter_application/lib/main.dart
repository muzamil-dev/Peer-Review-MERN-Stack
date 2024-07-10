import 'package:flutter/material.dart';
import 'package:flutter_application/src/app.dart';
import 'package:flutter_application/src/dashboard/user_dashboard.dart';
import 'package:flutter_application/src/forms/create_form.dart';
import 'package:flutter_application/src/forms/get_forms.dart';
import 'package:flutter_application/src/forms/edit_form.dart';
import 'package:flutter_application/src/groups/adminGroups.dart';
import 'package:flutter_application/src/groups/userGroups.dart';
import 'package:flutter_application/src/login-signup/loginsignup.dart';
import 'package:flutter_application/src/login-signup/passwordReset.dart';
import 'package:flutter_application/src/profile/analytics.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SharedPreferences prefs = await SharedPreferences.getInstance();

  runApp(MaterialApp(
    debugShowCheckedModeBanner: false,
    initialRoute: MyApp.routeName,
    routes: {
      MyApp.routeName: (context) => MyApp(
            token: prefs.getString('token'),
          ),

      LoginSignup.routeName: (context) => const LoginSignup(),
      PasswordResetPage.routeName: (context) => PasswordResetPage(),
      AdminGroup.routeName: (context) => AdminGroup(
            workspaceId: 14,
            userId: 3,
            token: prefs.getString('token'),
          ),
      UserGroup.routeName: (context) => UserGroup(
            token: prefs.getString('token'),
            workspaceId: 14,
            userId: 14,
          ),
      // Manually Added Create Forms Page for Debugging purposes. H alkhateeb
      CreateForm.routeName: (context) => CreateForm(
            workspaceId: 14,
            userId: 3,
            token: prefs.getString('token'),
          ),
      GetAssignments.routeName: (context) => GetAssignments(
            workspaceId: 14,
            userId: 3,
            token: prefs.getString('token'),
          ),
      // Manually Added Edit Forms Page for Debugging Purposes, User: Hashim DB
      EditForm.routeName: (context) => EditForm(
            assignmentId: 1,
            workspaceId: 14,
            userId: 3,
            token: prefs.getString('token'),
          ),
      // User Dashboard Page for Raheem Sterling
      UserDashboard.routeName: (context) => UserDashboard(
            token: prefs.getString('token'),
            workspaceId: 14,
          ),
      AnalyticsPage.routeName: (context) => AnalyticsPage(
            targetId: 15,
            workspaceId: 14,
            token: prefs.getString('token'),
            userId: 3,
          ),
    },
  ));
}
