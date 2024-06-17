import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';

/// The Widget that configures your application.
class AdminDashboard extends StatelessWidget {
  const AdminDashboard({
    super.key,
  });

  static const routeName = "/adminDashboard";

  void doLogin() {}

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      appBar: MainAppBar(title: "ADMIN DASHBOARD"),
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
