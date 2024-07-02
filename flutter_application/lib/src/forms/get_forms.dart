import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:http/http.dart' as http;

class GetAssignments extends StatefulWidget {
  final String userId;
  final String workspaceId;

  const GetAssignments(
      {super.key, required this.workspaceId, required this.userId});

  static const routeName = "/getAssignments";

  @override
  State<GetAssignments> createState() => _GetAssignmentsState();
}

class _GetAssignmentsState extends State<GetAssignments> {
  List<Assignment> assignments = [];
  bool isLoading = true;
  @override
  void initState() {
    super.initState();
    //Map<String, dynamic> jwtDecodedToken = JwtDecoder.decode(widget.token);
    //userId = jwtDecodedToken['userId'];
    print("hello");
    fetchAssignments();
  }

  Future<void> fetchAssignments() async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/workspaces/667a22ad8f5ce812352bba01/assignments');
    try {
      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      );

      print(response.body);
      print("hello");

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);

        setState(() {
          assignments =
              data.map((workspace) => Assignment.fromJson(workspace)).toList();
          isLoading = false;
        });

        //Navigator.pushNamed(context, '/createWorkspace');
      } else {
        throw Exception('Failed to load workspaces');
      }
    } catch (error) {
      print('Error fetching assignments: $error');
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'View Assignments',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ), // Change text color here
        ),
        backgroundColor: const Color(0xFF004080),
        centerTitle: true, // Center the title
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              Expanded(
                  child: ListView(
                children: assignments.map((assignment) {
                  return GestureDetector(
                    onTap: () {},
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("Start Date: "),
                                Text(assignment.startDate)
                              ],
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text("Due Date: "),
                                Text(assignment.dueDate)
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ))
            ]),
    );
  }
}

class Assignment {
  String id;
  String startDate;
  String dueDate;
  List<dynamic> questions;

  Assignment({
    required this.id,
    required this.startDate,
    required this.dueDate,
    required this.questions,
  });

  factory Assignment.fromJson(Map<String, dynamic> json) {
    return Assignment(
      id: json['assignmentId'],
      startDate: json['startDate'],
      dueDate: json['dueDate'],
      questions: json['questions'],
    );
  }
}
