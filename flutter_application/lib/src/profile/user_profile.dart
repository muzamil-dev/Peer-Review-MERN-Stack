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
  List<double> averageRatingsForAssignment = [];
  Map<int, List<String>> reviewersOfAssignment = {};
  List<double> averageRatingsPerUser = [];
  String nameOfProfile = '';
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    getAllData();
  }

  Future<void> getAllData() async {
    await getAllAssignments(context);
    await getUser(context);
    setState(() {
      isLoading = false;
    });
  }

  // Gets Current User Information
  Future<void> getUser(BuildContext context) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/${widget.userId}');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        print("Got User Successfully!");
        final jsonResponse = json.decode(response.body);
        setState(() {
          nameOfProfile =
              jsonResponse['firstName'] + ' ' + jsonResponse['lastName'];
        });
      }
    } catch (error) {
      print("Error Getting User: $error");
    }
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
            reviewersOfAssignment[response["assignmentId"]] = [];
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
          averageRatingsForAssignment.add(calculateAverageRating(
              reviews)); // Calculates total average rating
          for (var review in reviews) {
            reviewersOfAssignment[assignmentId]!.add(review["firstName"] + ' ' + review["lastName"]);
            // double sum = 0;
            // for (var rating in review['ratings']) {
            //   sum += rating;
            }
          //   double averageRating = sum / review['ratings'].length;
          //   averageRatingsPerUser.add(averageRating);
          // }
        });
      } else {
        averageRatingsForAssignment.add(-2);
      }
    } catch (error) {
      print("Error Getting Reviews on User: $error");
    }
  }

  double calculateAverageRating(dynamic reviews) {
    if (reviews.isEmpty) {
      print(reviews);
      return -1;
    }

    double sum = 0;
    double numRatings = 0;

    for (Map review in reviews) {
      List<dynamic> ratings = review["ratings"];
      for (var rating in ratings) {
        sum += rating;
        numRatings += 1;
      }
    }
    return sum / numRatings;
  }

  Widget printAssignmentAverageRating(double averageRating) {
    if (averageRating == -1) {
      return const Text("Rating: N/A");
    }
    else if (averageRating == -2) {
      return const Text("Not Assigned");
    }
    else {
      return Text("Rating: $averageRating");
    }
  }

  Widget printReviewersOfAssignment(int index) {
    int currentAssignmentId = assignmentIds[index];
    List<String> reviewers = reviewersOfAssignment[currentAssignmentId] ?? [];
    return Column(
              children: reviewers.map((reviewer) => Text(reviewer)).toList(),
            );
  }

  Widget assignmentItem(BuildContext context, int index) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(assignmentNames[index]),
                printAssignmentAverageRating(averageRatingsForAssignment[index]),
              ],
            ), // Assignment Name
            const Text("Reviews: "),
            printReviewersOfAssignment(index),
          ],
        ),
      ),
    );
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
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                children: [
                  Text(
                    "Profile for: $nameOfProfile",
                    style: const TextStyle(fontSize: 20),
                  ),
                  Expanded(
                    child: RawScrollbar(
                        child: ListView.separated(
                            itemBuilder: (context, index) {
                              return assignmentItem(context, index);
                            },
                            separatorBuilder: (context, index) {
                              return const Divider(
                                height: 10,
                                thickness: 0,
                              );
                            },
                            itemCount: assignmentIds.length)),
                  ),
                ],
              ),
            ),
    );
  }
}
