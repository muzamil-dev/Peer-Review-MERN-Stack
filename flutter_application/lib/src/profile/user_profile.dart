import 'package:flutter/material.dart';
import "package:flutter_application/src/profile/analytics.dart";
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_application/core.services/api.dart';

class UserProfile extends StatefulWidget {
  final int workspaceId;
  final int targetId;
  final int userId;

  const UserProfile(
      {required this.targetId,
      required this.workspaceId,
      required this.userId,
      super.key});

  @override
  State<UserProfile> createState() => _UserProfileState();
}

class _UserProfileState extends State<UserProfile> {
  List<int> assignmentIds = [];
  List<DateTime> dueDates = [];
  List<String> assignmentNames = [];
  List<double> averageRatingsForAssignment = [];
  Map<int, List<String>> reviewersOfAssignment = {};
  Map<int, List<double>> averageRatingsPerUser = {};
  String nameOfProfile = '';
  bool isLoading = true;
  final storage = const FlutterSecureStorage();
  final apiInstance = Api();

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
    final url = '/users/${widget.targetId}';

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        print("Got User Successfully!");
        final jsonResponse = response.data;
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
    final url = '/workspaces/${widget.workspaceId}/assignments';

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = response.data;

        List<int> tempAssignmentIds = [];
        List<String> tempAssignmentNames = [];
        List<double> tempAverageRatingsForAssignment = [];
        Map<int, List<String>> tempReviewersOfAssignment = {};
        Map<int, List<double>> tempAverageRatingsPerUser = {};

        for (var response in jsonResponse) {
          int assignmentId = response["assignmentId"];
          tempAssignmentIds.add(assignmentId);
          tempAssignmentNames.add(response["name"]);
          var parsedDate = DateTime.parse(response["dueDate"]);
          dueDates.add(parsedDate);
          tempReviewersOfAssignment[assignmentId] = [];
          tempAverageRatingsPerUser[assignmentId] = [];
        }
        for (var assignmentId in tempAssignmentIds) {
          await getReviewsTowardUser(assignmentId, tempReviewersOfAssignment,
              tempAverageRatingsPerUser, tempAverageRatingsForAssignment);
        }

        setState(() {
          assignmentIds = tempAssignmentIds;
          assignmentNames = tempAssignmentNames;
          averageRatingsForAssignment = tempAverageRatingsForAssignment;
          reviewersOfAssignment = tempReviewersOfAssignment;
          averageRatingsPerUser = tempAverageRatingsPerUser;
        });
      }
    } catch (error) {
      print("Error Getting Workspace Assignments: $error");
    }
  }

  // Gets all the Reviews Made on a User in the given assignment
  Future<void> getReviewsTowardUser(
      int assignmentId,
      Map<int, List<String>> tempReviewersOfAssignment,
      Map<int, List<double>> tempAverageRatingsPerUser,
      List<double> tempAverageRatingsForAssignment) async {
    final url = "/assignments/$assignmentId/target/${widget.targetId}";

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        final reviews = jsonResponse["reviews"];

        // Calculates Total Average Rating Per Assignment
        double avgRating = calculateTotalAverageRating(reviews);
        tempAverageRatingsForAssignment.add(avgRating);
        
        // Exits if the current assignment has No Reviews
        if (avgRating == -1) {
          return;
        }
        // Calculates Reviewers of Assignment and Their Individual Average Rating
        for (var review in reviews) {
          // Individual Reviewer Name Stored
          String firstName = review['firstName'];
          String lastName = review['lastName'];
          tempReviewersOfAssignment[assignmentId]!.add('$firstName $lastName');

          // Calculates Average Rating of Individual Reviewer
          double sum = 0;
          final ratings = review['ratings'];
          for (var rating in ratings) {
            sum += rating;
          }

          double averageRating = sum / ratings.length;
          tempAverageRatingsPerUser[assignmentId]!.add(averageRating);
        }
      } else {
        // Handles Case Where the Assignment Has Not Been Assigned to Individual
        tempAverageRatingsForAssignment.add(-2);
      }
    } catch (error) {
      print("Error Getting Reviews on User: $error");
      print(url);
    }
  }

  // Takes in a reviews and returns the total average rating of the Assignment
  double calculateTotalAverageRating(dynamic reviews) {
    if (reviews == null || reviews.isEmpty) {
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
      return const Text(
        "Ratings: None",
        style: TextStyle(fontSize: 15.0),
      );
    } else if (averageRating == -2) {
      return const Text("Not Assigned");
    } else {
      return Text(
        "Avg Rating: $averageRating",
        style: const TextStyle(fontSize: 14.0, fontWeight: FontWeight.w500),
      );
    }
  }

  Widget printReviewersOfAssignment(int index) {
    int currentAssignmentId = assignmentIds[index];
    List<String> reviewers = reviewersOfAssignment[currentAssignmentId] ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: reviewers.map((reviewer) => Text(reviewer)).toList(),
    );
  }

  Widget printRatingsOfReviewers(int index) {
    int currentAssignmentId = assignmentIds[index];
    List<double> ratings = averageRatingsPerUser[currentAssignmentId] ?? [];

    return Column(
      children: ratings.map((rating) => Text("$rating")).toList(),
    );
  }

  Widget printBodyOfCards(double averageRating) {
    if (averageRating != -1 && averageRating != -2) {
      return const Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            "Reviewers: ",
            style: TextStyle(fontSize: 17),
          ),
          Text("Ratings:", style: TextStyle(fontSize: 17))
        ],
      );
    } else {
      return const SizedBox();
    }
  }

  Widget printPastDue(DateTime dueDate) {
    var now = DateTime.now();

    if (dueDate.isBefore(now)) {
      return const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            "Assigment Past Due",
            style: TextStyle(color: Colors.red),
          )
        ],
      );
    } else {
      return const SizedBox();
    }
  }

  Widget assignmentItem(BuildContext context, int index) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  assignmentNames[index],
                  style: const TextStyle(
                      fontSize: 23.0, fontWeight: FontWeight.bold),
                ),
                printAssignmentAverageRating(
                    averageRatingsForAssignment[index]),
              ],
            ),
            const SizedBox(
              height: 20,
            ),
            printBodyOfCards(
                averageRatingsForAssignment[index]), // Assignment Name
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                printReviewersOfAssignment(index),
                printRatingsOfReviewers(index),
              ],
            ),
            printPastDue(dueDates[index]),
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
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "$nameOfProfile's Profile",
                    style: const TextStyle(
                        fontSize: 30, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Assignments:",
                        style: TextStyle(
                            fontSize: 26, fontWeight: (FontWeight.bold)),
                      ),
                      InkWell(
                        onTap: () {},
                        child: Column(
                          children: [
                            Container(
                                decoration: BoxDecoration(
                                    color: Colors.green,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: Colors.black,
                                      width: 1,
                                    )),
                                child: IconButton(
                                    onPressed: () {
                                      Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => AnalyticsPage(
                                              userId: widget.userId,
                                              targetId: widget.targetId,
                                              workspaceId: widget.workspaceId,
                                            ),
                                          )); // Adjust the route name as needed
                                    },
                                    icon: const Icon(
                                      Icons.bar_chart_rounded,
                                      size: 30,
                                      color: Colors.black,
                                    ))),
                            const Text(
                              "Analytics",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
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
