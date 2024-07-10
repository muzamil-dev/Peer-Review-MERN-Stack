import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import "dart:convert";
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AnalyticsPage extends StatefulWidget {
  final int targetId;
  final int workspaceId;
  static const routeName = "/analytics";

  const AnalyticsPage(
      {required this.targetId, required this.workspaceId, super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  String userName = '';
  late int userId;
  late dynamic token;

  @override
  void initState() {
    super.initState();
  }

  // Allows for Persistent Storage of JWT Token
  Future<void> initSharedPref() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');
  }

  Future<void> getAnalyticsForUser() async {
    final url = Uri.parse(
        "http://10.0.2.2:5000/analytics/workspace/${widget.workspaceId}/user/${widget.targetId}");

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        print(jsonResponse);
      } else {
        final error = json.decode(response.body);
        print("Error: $error");
      }
    } catch (error) {
      print("Error Getting Analytics for User: $error");
    }
  }

  Future<void> _initializeAndFetchData() async {
    await initSharedPref();
    print("Token: ${token}");
    await getAnalyticsForUser();
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
          iconTheme: IconThemeData(color: Colors.white),
        ),
        body: FutureBuilder(
            future: _initializeAndFetchData(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                return Center(
                  child: Text("${snapshot.error}"),
                );
              } else {
                return Column(
                  children: [Text("Analytics for ")],
                );
              }
            }));
  }
}
