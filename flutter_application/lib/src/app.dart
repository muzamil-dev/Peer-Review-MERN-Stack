import 'package:flutter/material.dart';
import 'package:flutter_application/components/MainAppBar.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'sample_feature/sample_item_details_view.dart';
import 'sample_feature/sample_item_list_view.dart';
import 'settings/settings_controller.dart';
import 'settings/settings_view.dart';

/// The Widget that configures your application.
class MyApp extends StatelessWidget {
  const MyApp({
    super.key,
  });

  static const routeName = "/debug";

  @override
  Widget build(BuildContext context) {
    // Glue the SettingsController to the MaterialApp.
    //
    // The ListenableBuilder Widget listens to the SettingsController for changes.
    // Whenever the user updates their settings, the MaterialApp is rebuilt.
    return Scaffold(
        appBar: const MainAppBar(title: "DEBUG PAGE VIEWER"),
        body: Center(
          child: Column(
            children: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/login");
                },
                child: const Text("LOGIN PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/signup");
                },
                child: const Text("SIGNUP PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/adminDashboard");
                },
                child: const Text("ADMIN DASHBOARD PAGE"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, "/userDashboard");
                },
                child: const Text("USER DASHBOARD PAGE"),
              ),
            ],
          ),
        ));
  }
}
