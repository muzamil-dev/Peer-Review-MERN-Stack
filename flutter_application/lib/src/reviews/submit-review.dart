import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:intl/intl.dart';
import 'dart:convert';

class StudentReview extends StatefulWidget {
  static const routeName = '/studentReview';
  final int userId;
  final int targetUserId;
  final int assignmentId;

  const StudentReview({required this.userId, required this.targetUserId, required this.assignmentId, super.key});

  @override
  State<StudentReview> createState() => _StudentReviewState();
}

class _StudentReviewState extends State<StudentReview> {
  late String assignmentName;
  late String startDate;
  late String dueDate;

  late List<Object> questions;

  @override
  void initState() {
    super.initState();
    getAssignmentDetails(context);
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
  
  void getAssignmentDetails(BuildContext context) async {
    final url = Uri.parse('http://10.0.2.2:5000/assignments/${widget.assignmentId}');
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        setState(() {
            assignmentName = jsonResponse["name"];
            startDate = getDateString(jsonResponse["startDate"]);
            dueDate = getDateString(jsonResponse["dueDate"]);
            questions = jsonResponse["questions"];
        });
      }
    }
    catch (error) {
      print("Error Getting Review Details: $error");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Student Review Page"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title of Assignment
            Container(
              margin: const EdgeInsets.fromLTRB(3.0, 0, 0, 0),
              child: Text(
                assignmentName,
                style: const TextStyle(
                    fontSize: 35.0, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.black, width: 3),
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.all(10.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  const Text(
                    "Due: ",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  // Due Date of Assignment
                  Text(
                    dueDate,
                    style: const TextStyle(
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(
                    width: 15,
                  ),
                  const Text(
                    "Questions: ",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  // Number of Questions
                  Text(
                    "${questions.length}",
                    style: const TextStyle(
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(
                    width: 15,
                  ),
                  const Text(
                    "Status: ",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const CircleAvatar(
                    radius: 15,
                    backgroundColor: Colors.red,
                    child: IconButton(
                      onPressed: null,
                      icon: Icon(
                        Icons.close_outlined,
                        color: Colors.white,
                        size: 15,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Expanded(
                child: RawScrollbar(
              thumbColor: Colors.black,
              child: ListView.separated(
                  itemBuilder: (context, index) {
                    Map currentQuestionObject = (questions[index] as Map);
                    String currentQuestion = currentQuestionObject["question"];

                    return Container(
                      decoration: BoxDecoration(
                          border: Border.all(color: Colors.black, width: 1)),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Question ${index + 1}",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 25,
                            ),
                          ),
                          const SizedBox(
                            height: 7,
                          ),
                          // Current Question
                          Text(
                            currentQuestion,
                            style: const TextStyle(fontSize: 20),
                          ),
                          const SizedBox(
                            height: 15,
                          ),
                          RatingBar.builder(
                            initialRating: 0,
                            minRating: 0,
                            direction: Axis.horizontal,
                            allowHalfRating: false,
                            itemCount: 5,
                            itemPadding:
                                const EdgeInsets.symmetric(horizontal: 4.0),
                            itemBuilder: (context, _) => const Icon(
                              Icons.star,
                              color: Colors.amber,
                            ),
                            onRatingUpdate: (rating) {
                              print(rating);
                            },
                          ),
                        ],
                      ),
                    );
                  },
                  separatorBuilder: (context, index) {
                    return const Divider(
                      height: 10,
                      thickness: 0,
                    );
                  },
                  itemCount: questions.length),
            )),
          ],
        ),
      ),
    );
  }
}