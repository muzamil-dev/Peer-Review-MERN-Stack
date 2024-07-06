import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import "dart:convert";

class UserProfile extends StatefulWidget {
  final int workspaceId;
  final int userId;
  const UserProfile(
      {required this.userId, required this.workspaceId, super.key});

  @override
  State<UserProfile> createState() => _UserProfileState();
}

class _UserProfileState extends State<UserProfile> {
  List<int> assignmentIds = [];
  List<String> assignmentNames = [];
  Map<int, String> reviewersOfAssignment = {};
  List<double> averageRatingsForAssignment = [];
  List<double> averageRatingsPerUser = [];

  @override
  void initState() {
    super.initState();
    getAllAssignments(context);
  }

  // Gets All Assignment Id's in the Given Workspace
  Future<void> getAllAssignments(BuildContext context) async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/assignments');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        setState(() {
          for (var response in jsonResponse) {
            assignmentIds.add(response["assignmentId"]);
            assignmentNames.add(response["name"]);
            getReviewsTowardUser(context, response["assignmentId"]);
          }
        });
      }
    } catch (error) {
      print("Error Getting Workspace Assignments: $error");
    }
  }

  // Gets all the Reviews Made on a User in the given assignment
  Future<void> getReviewsTowardUser(
      BuildContext context, int assignmentId) async {
    final url = Uri.parse(
        "http://10.0.2.2:5000/assignments/$assignmentId/target/${widget.userId}");
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        final reviews = jsonResponse["reviews"];
        setState(() {
          averageRatingsForAssignment.add(calculateAverageRating(reviews));
          for (var review in reviews) {

            reviewersOfAssignment[assignmentId] = review["firstName"] + review["lastName"];
            double sum = 0;
            for (var rating in review['ratings']) {
              sum += rating;
            }
            double averageRating = sum / review['ratings'].length;
            averageRatingsPerUser.add(averageRating);
          }
        });
      }
    } catch (error) {
      print("Error Getting Reviews on User: $error");
    }
  }

  double calculateAverageRating(List<Map> reviews) {
    if (reviews.isEmpty) {
      return -1;
    }
    
    double sum = 0;
    double numRatings = 0;

    for (Map review in reviews) {
      List<int> ratings = review["ratings"];
      for (int rating in ratings) {
        sum += rating;
        numRatings += 1;
      }
    }
    return sum / numRatings;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "User Profile Page",
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF004080),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(),
    );
  }
}
