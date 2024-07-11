import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import "dart:convert";

class AnalyticsPage extends StatefulWidget {
  final int targetId;
  final int workspaceId;
  final int userId;
  final dynamic token;
  static const routeName = "/analytics";

  const AnalyticsPage(
      {required this.targetId,
      required this.userId,
      required this.workspaceId,
      required this.token,
      super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  String userName = '';
  List<double> averageRatings = [];
  List<String> assignmentNames = [];

  @override
  void initState() {
    super.initState();
    print("Token: ${widget.token}");
    getAnalyticsForUser();
  }

  Future<void> getAnalyticsForUser() async {
    final url = Uri.parse(
        "http://10.0.2.2:5000/analytics/workspace/${widget.workspaceId}/user/${widget.targetId}");

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
      );
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        List<String> tempAssignmentNames = [];

        for (var response in jsonResponse["assignments"]) {
          await getAssignmentInfo(
              response["assignmentId"], tempAssignmentNames);
          setState(() {
            if (response["averageRating"] != null) {
              averageRatings.add(response["averageRating"]);
            } else {
              averageRatings.add(-1);
            }
            assignmentNames = tempAssignmentNames;
          });
        }
        print(assignmentNames);
        print(averageRatings);
      } else {
        final error = json.decode(response.body);
        print("Error: $error");
      }
    } catch (error) {
      print("Error Getting Analytics for User: $error");
    }
  }

  Future<void> getAssignmentInfo(
      int assignmentId, List<String> assignmentNames) async {
    final url = Uri.parse('http://10.0.2.2:5000/assignments/$assignmentId');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
      );
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        assignmentNames.add(jsonResponse["name"]);
      } else {
        print("error: ");
      }
    } catch (error) {
      print("Error Getting Assignment Info: $error");
    }
  }

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
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: const Column(
        children: [Text("Analytics for ")],
      ),
    );
  }
}
