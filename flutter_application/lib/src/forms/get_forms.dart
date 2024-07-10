import 'dart:convert';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application/src/forms/create_form.dart';
import 'package:flutter_application/src/forms/edit_form.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

class GetAssignments extends StatefulWidget {
  final int userId;
  final int workspaceId;
  final dynamic token;

  const GetAssignments(
      {super.key,
      required this.token,
      required this.workspaceId,
      required this.userId});

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
    fetchAssignments();
  }

  Future<void> fetchAssignments() async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/assignments');
    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
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

  Future<void> deleteAssignment(int assignmentId) async {
    final url = Uri.parse('http://10.0.2.2:5000/assignments/${assignmentId}');
    try {
      final response = await http.delete(url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${widget.token}',
          },
          body: jsonEncode({
            "userId": widget.userId,
          }));

      if (response.statusCode == 200) {
        print("Deleted Assignment Successfully!");
        setState(() {
          fetchAssignments();
        });
      }
    } catch (error) {
      print("Error Deleting Assignment: $error");
    }
  }

  String getDateString(String date) {
    // Parse the input date string
    DateTime dateTime = DateTime.parse(date);

    // Define the desired date format
    DateFormat dateFormat = DateFormat("MM/dd/yy");

    // Format the DateTime object to the desired string format
    String formattedDate = dateFormat.format(dateTime);

    return formattedDate;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'View Assignments',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ), // Change text color here
            ),
            GestureDetector(
              onTap: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CreateForm(
                      token: widget.token,
                      workspaceId: widget.workspaceId,
                      userId: widget.userId,
                    ),
                  ),
                );
                fetchAssignments();
              },
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.all(Radius.circular(12)),
                  border: Border.all(color: Colors.green, width: 1),
                  color: Colors.green,
                ),
                padding: const EdgeInsets.all(6),
                child: const Icon(
                  Icons.add,
                  color: Colors.white,
                  size: 30,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF004080),
        iconTheme: const IconThemeData(color: Colors.white), // Center the title
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
              Expanded(
                  child: ListView(
                children: assignments.map((assignment) {
                  return GestureDetector(
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EditForm(
                            token: widget.token,
                            assignmentId: assignment.id,
                            workspaceId: widget.workspaceId,
                            userId: widget.userId,
                          ),
                        ),
                      );
                      fetchAssignments();
                    },
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  assignment.name,
                                  style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold),
                                ),
                                Column(
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        const Text("Start Date: "),
                                        const SizedBox(width: 15),
                                        Text(
                                            getDateString(assignment.startDate))
                                      ],
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        const Text("Due Date: "),
                                        const SizedBox(width: 15),
                                        Text(getDateString(assignment.dueDate))
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 5),
                            SizedBox(
                              width: double.infinity,
                              child: Column(
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text("Questions: ",
                                        style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w500,
                                        )),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.start,
                                      children: assignment.questions
                                          .map<Widget>((question) {
                                        return Text(
                                          question,
                                          style: const TextStyle(fontSize: 16),
                                        );
                                      }).toList(),
                                    ),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        CircleAvatar(
                                          radius: 20,
                                          backgroundColor: Colors.red,
                                          child: IconButton(
                                              onPressed: () async {
                                                deleteAssignment(assignment.id);
                                              },
                                              icon: const Icon(
                                                CupertinoIcons.trash,
                                                color: Colors.white,
                                              )),
                                        ),
                                      ],
                                    ),
                                  ]),
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
  int id;
  String name;
  String startDate;
  String dueDate;
  List<dynamic> questions;

  Assignment({
    required this.id,
    required this.name,
    required this.startDate,
    required this.dueDate,
    required this.questions,
  });

  factory Assignment.fromJson(Map<String, dynamic> json) {
    return Assignment(
      id: json['assignmentId'],
      name: json['name'],
      startDate: json['startDate'],
      dueDate: json['dueDate'],
      questions: json['questions'],
    );
  }

  List<dynamic> getQuestions() {
    return questions;
  }
}
