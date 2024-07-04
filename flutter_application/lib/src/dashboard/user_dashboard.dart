import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';
import "package:http/http.dart" as http;
import "dart:convert";



/// The Widget that configures your application.
class UserDashboard extends StatefulWidget {
  final String userId;
  final String workspaceId;
  static const routeName = "/userDashboard";

  const UserDashboard({
    required this.userId,
    required this.workspaceId,
    super.key,
  });

  @override
  State<UserDashboard> createState() => _UserDashboardState();
}

class _UserDashboardState extends State<UserDashboard> {
  late String userName;

  @override
  initState() {
    super.initState();
    getUser(context);
  }

  Future<void> getUser(BuildContext context) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/${widget.userId}');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        print("Got User Successfully!");
        final jsonResponse = json.decode(response.body);
        userName = jsonResponse['firstName'] + ' ' + jsonResponse['lastName'];
      }
    }
    catch(error) {
      print("Error Getting User: $error");
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      appBar: MainAppBar(title: "USER DASHBOARD", backgroundColor: Color(0xFF9bc4bc),),
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
