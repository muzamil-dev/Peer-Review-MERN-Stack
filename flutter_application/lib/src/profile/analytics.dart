import 'package:flutter/material.dart';

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
      body: Column(
        children: [Text("Analytics for ")],
      ),
    );
  }
}
