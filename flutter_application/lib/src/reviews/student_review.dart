import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'dart:convert';

class StudentReview extends StatefulWidget {
  static const routeName = '/studentReview';
  final int userId;
  final int targetUserId;
  final int assignmentId;
  final int reviewId;

  const StudentReview(
      {required this.userId,
      required this.targetUserId,
      required this.assignmentId,
      required this.reviewId,
      super.key});

  @override
  State<StudentReview> createState() => _StudentReviewState();
}

class _StudentReviewState extends State<StudentReview> {
  String assignmentName = '';
  String targetUserName = '';
  String startDate = '';
  String dueDate = '';
  // Keeps Track of Every Question
  List<dynamic> questions = [];
  // Keeps Track of the Ratings Of Every Question
  List<double> ratings = [];
  final apiInstance = Api();
  final storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    getAssignmentDetails(context);
    getUser(context);
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

  // Gets Current User Information
  Future<void> getUser(BuildContext context) async {
    final url = '/users/${widget.targetUserId}';

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        print("Got User Successfully!");
        final jsonResponse = response.data;
        setState(() {
          targetUserName =
              jsonResponse['firstName'] + ' ' + jsonResponse['lastName'];
        });
      }
    } catch (error) {
      print("Error Getting User: $error");
    }
  }

  void getAssignmentDetails(BuildContext context) async {
    final url = '/assignments/${widget.assignmentId}';

    try {
      final response = await apiInstance.api.get(url);
      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        setState(() {
          assignmentName = jsonResponse["name"];
          startDate = getDateString(jsonResponse["startDate"]);
          dueDate = getDateString(jsonResponse["dueDate"]);
          questions = jsonResponse["questions"];
          // ignore: unused_local_variable
          for (var i in jsonResponse["questions"]) {
            ratings.add(3);
          }
        });
      }
    } catch (error) {
      print("Error Getting Review Details: $error");
    }
  }

  void submitReview(BuildContext context) async {
    const url = "/reviews/submit";

    try {
      final response = await apiInstance.api.post(url,
          data: jsonEncode({
            "userId": widget.userId,
            "reviewId": widget.reviewId,
            "ratings": ratings,
          }));
      if (response.statusCode == 200) {
        print("Review Submitted Successfully!");
        Navigator.pop(context);
      } else {
        print("Error : ");
      }
    } catch (error) {
      print("Error Submitting Review: $error");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
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
                "Student Review",
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        backgroundColor: const Color(0xff004080),
      ),
      body: Container(
        color: const Color(0xff004080),
        padding: const EdgeInsets.all(10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title of Assignment
            Container(
              margin: const EdgeInsets.fromLTRB(3.0, 0, 0, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    assignmentName,
                    style: const TextStyle(
                        fontSize: 35.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                  const SizedBox(
                    height: 15,
                  ),
                  Container(
                    padding: const EdgeInsets.all(12.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border:
                          Border.all(color: const Color(0xff004080), width: 1),
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                    child: Text("Review for $targetUserName",
                        style: const TextStyle(
                          fontSize: 16.0,
                          fontWeight: FontWeight.w600,
                        )),
                  ),
                ],
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xff004080), width: 1),
                borderRadius: BorderRadius.circular(12),
                color: Colors.white,
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
                    String currentQuestion = questions[index];

                    return Container(
                      decoration: BoxDecoration(
                          border: Border.all(
                              color: const Color(0xff004080), width: 1),
                          borderRadius: BorderRadius.circular(8.0),
                          color: Colors.white),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "Question ${index + 1}",
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 27,
                                ),
                              ),
                              Text(
                                "Rating: ${ratings[index].toInt()} / 5",
                                style: const TextStyle(
                                  fontSize: 20,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(
                            height: 7,
                          ),
                          // Current Question
                          Text(
                            currentQuestion,
                            style: const TextStyle(fontSize: 22),
                          ),
                          const SizedBox(
                            height: 15,
                          ),
                          RatingBar.builder(
                            initialRating: 3,
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
                              setState(() {
                                ratings[index] = rating;
                              });
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
      floatingActionButton: FloatingActionButton(
          onPressed: () {
            submitReview(context);
          },
          backgroundColor: Colors.green,
          child: const Icon(
            Icons.check,
            color: Colors.white,
            size: 40,
          )),
    );
  }
}
