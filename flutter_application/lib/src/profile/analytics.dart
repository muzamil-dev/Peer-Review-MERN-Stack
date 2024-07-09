import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import "dart:convert";

class AnalyticsPage extends StatefulWidget {
  final int targetId;
  final int userId;
  final int workspaceId;
  const AnalyticsPage(
      {required this.targetId,
      required this.userId,
      required this.workspaceId,
      super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  String userName = '';

  @override
  void initState() {
    super.initState();
    // getAnalyticsForUser(context);
  }

  // Future<void> getAnalyticsForUser(BuildContext context) async {
  //   final url = Uri.parse(
  //       "http://10.0.2.2:5000/analytics/workspace/${widget.workspaceId}/user/${widget.targetId}");

  //   try {
  //     final response = await http.get(
  //       url,
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: jsonEncode({
  //         "userId": widget.userId,
  //       }),
  //     );
  //     if (response.statusCode == 200) {
  //       final jsonResponse = json.decode(response.body);
  //       print(jsonResponse);
  //     }
  //   } catch (error) {
  //     print("Error Getting Analytics for User: $error");
  //   }
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Analytics",
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        backgroundColor: const Color(0xFF004080),
        iconTheme: IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [Text("Analytics for ")],
      ),
    );
  }
}
