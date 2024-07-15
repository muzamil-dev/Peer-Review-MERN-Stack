import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application/src/forms/create_form.dart';
import 'package:flutter_application/src/forms/edit_form.dart';
import 'package:intl/intl.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_application/core.services/api.dart';
import 'dart:convert';
import 'package:flutter_svg/flutter_svg.dart';

class GetAssignments extends StatefulWidget {
  final int userId;
  final int workspaceId;

  const GetAssignments(
      {super.key, required this.workspaceId, required this.userId});

  static const routeName = "/getAssignments";

  @override
  State<GetAssignments> createState() => _GetAssignmentsState();
}

class _GetAssignmentsState extends State<GetAssignments> {
  List<Assignment> assignments = [];
  bool isLoading = true;
  final storage = const FlutterSecureStorage();
  final apiInstance = Api();

  @override
  void initState() {
    super.initState();
    //Map<String, dynamic> jwtDecodedToken = JwtDecoder.decode(widget.token);
    //userId = jwtDecodedToken['userId'];
    fetchAssignments();
  }

  Future<void> fetchAssignments() async {
    final url = '/workspaces/${widget.workspaceId}/assignments';

    try {
      final response = await apiInstance.api.get(
        url,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;

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
    final url = '/assignments/$assignmentId';

    try {
      final response = await apiInstance.api.delete(url,
          data: jsonEncode({
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

  Widget displayBody() {
    if (assignments.isEmpty) {
      return const Center(
        child: Text(
          "Create a New Assignment Using the + Button",
          style: TextStyle(
              fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
      );
    } else {
      return Column(children: [
        Expanded(
            child: RawScrollbar(
          thumbColor: Colors.black38,
          child: ListView(
            children: assignments.map((assignment) {
              return GestureDetector(
                onTap: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => EditForm(
                        assignmentId: assignment.id,
                        workspaceId: widget.workspaceId,
                        userId: widget.userId,
                      ),
                    ),
                  );
                  fetchAssignments();
                },
                child: Column(
                  children: [
                    Card(
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
                                                showDialog(
                                                    context: context,
                                                    builder:
                                                        (BuildContext context) {
                                                      return AlertDialog(
                                                        title: const Row(
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .center,
                                                          children: [
                                                            Text(
                                                              'Delete Assignment?',
                                                              style: TextStyle(
                                                                  fontSize: 30,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .bold),
                                                            ),
                                                          ],
                                                        ),
                                                        contentPadding:
                                                            const EdgeInsets
                                                                .all(15.0),
                                                        content: Row(
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .center,
                                                          children: [
                                                            Flexible(
                                                              child: Text(
                                                                  assignment
                                                                      .name,
                                                                  style:
                                                                      const TextStyle(
                                                                    fontSize:
                                                                        25,
                                                                  )),
                                                            ),
                                                          ],
                                                        ),
                                                        actions: [
                                                          Row(
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .spaceAround,
                                                            children: [
                                                              TextButton(
                                                                onPressed: () {
                                                                  deleteAssignment(
                                                                      assignment
                                                                          .id);
                                                                  Navigator.pop(
                                                                      context);
                                                                },
                                                                child: const Text(
                                                                    'Delete'),
                                                              ),
                                                              TextButton(
                                                                onPressed: () {
                                                                  Navigator.pop(
                                                                      context);
                                                                },
                                                                child: const Text(
                                                                    'Cancel'),
                                                              ),
                                                            ],
                                                          ),
                                                        ],
                                                      );
                                                    });
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
                    const SizedBox(height: 8),
                  ],
                ),
              );
            }).toList(),
          ),
        ))
      ]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF004080),
      appBar: AppBar(
        centerTitle: true,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SvgPicture.asset(
              'assets/images/RMP_Icon.svg',
              width: 35,
              height: 35,
            ),
            const Flexible(
              child: Text(
                "View Assignments",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF004080),
        iconTheme: const IconThemeData(color: Colors.white), // Center the title
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(8.0),
              child: displayBody(),
            ),
      floatingActionButton: FloatingActionButton(
          backgroundColor: Colors.green,
          onPressed: () async {
            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CreateForm(
                  workspaceId: widget.workspaceId,
                  userId: widget.userId,
                ),
              ),
            );
            fetchAssignments();
          },
          child: const Icon(
            Icons.add,
            color: Colors.white,
            size: 35,
          )),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
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
