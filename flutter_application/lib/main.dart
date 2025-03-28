import 'package:flutter/material.dart';
import 'package:flutter_application/src/app.dart';
import 'package:flutter_application/src/forms/create_form.dart';
import 'package:flutter_application/src/forms/get_forms.dart';
import 'package:flutter_application/src/forms/edit_form.dart';
import 'package:flutter_application/src/groups/adminGroups.dart';
import 'package:flutter_application/src/groups/userGroups.dart';
import 'package:flutter_application/src/login-signup/loginsignup.dart';
import 'package:flutter_application/src/login-signup/passwordReset.dart';
import 'package:flutter_application/src/profile/analytics.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';


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
      AdminGroup.routeName: (context) => const AdminGroup(
            workspaceId: 14,
            userId: 3,
          ),
      UserGroup.routeName: (context) => const UserGroup(
            workspaceId: 14,
            userId: 14,
          ),
      // Manually Added Create Forms Page for Debugging purposes. H alkhateeb
      CreateForm.routeName: (context) => const CreateForm(
            workspaceId: 14,
            userId: 3,
          ),
      GetAssignments.routeName: (context) => const GetAssignments(
            workspaceId: 14,
            userId: 3,
          ),
      // Manually Added Edit Forms Page for Debugging Purposes, User: Hashim DB
      EditForm.routeName: (context) => const EditForm(
            assignmentId: 1,
            workspaceId: 14,
            userId: 3,
          ),
      AnalyticsPage.routeName: (context) => const AnalyticsPage(
            targetId: 15,
            workspaceId: 14,
            userId: 3,
          ),
    },
  ));
}
