import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
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
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod/riverpod.dart';

final apiProvider = Provider((ref) => Api());
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // ignore: prefer_const_constructors
  final storage = FlutterSecureStorage();

  runApp(MaterialApp(
    debugShowCheckedModeBanner: false,
    initialRoute: MyApp.routeName,
    routes: {
      MyApp.routeName: (context) => MyApp(
            token: storage.read(key: 'token'),
          ),

      LoginSignup.routeName: (context) => const LoginSignup(),
      PasswordResetPage.routeName: (context) => PasswordResetPage(),
      AdminGroup.routeName: (context) => AdminGroup(
            workspaceId: 14,
            userId: 3,
            token: storage.read(key: 'token'),
          ),
      UserGroup.routeName: (context) => UserGroup(
            token: storage.read(key: 'token'),
            workspaceId: 14,
            userId: 14,
          ),
      // Manually Added Create Forms Page for Debugging purposes. H alkhateeb
      CreateForm.routeName: (context) => CreateForm(
            workspaceId: 14,
            userId: 3,
            token: storage.read(key: 'token'),
          ),
      GetAssignments.routeName: (context) => GetAssignments(
            workspaceId: 14,
            userId: 3,
            token: storage.read(key: 'token'),
          ),
      // Manually Added Edit Forms Page for Debugging Purposes, User: Hashim DB
      EditForm.routeName: (context) => EditForm(
            assignmentId: 1,
            workspaceId: 14,
            userId: 3,
            token: storage.read(key: 'token'),
          ),
      // User Dashboard Page for Raheem Sterling
      UserDashboard.routeName: (context) => UserDashboard(
            token: storage.read(key: 'token'),
            workspaceId: 14,
          ),
      AnalyticsPage.routeName: (context) => AnalyticsPage(
            targetId: 15,
            workspaceId: 14,
            token: storage.read(key: 'token'),
            userId: 3,
          ),
    },
  ));
}
