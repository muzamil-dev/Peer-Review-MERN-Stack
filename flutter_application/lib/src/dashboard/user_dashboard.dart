import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';

/// The Widget that configures your application.
class UserDashboard extends StatelessWidget {
  const UserDashboard({
    super.key,
  });

  static const routeName = "/userDashboard";

  void doLogin() {}

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      appBar: MainAppBar(title: "USER DASHBOARD"),
      body: Padding(
        padding: EdgeInsets.all(15),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [],
        ),
      ),
    );
  }
}
