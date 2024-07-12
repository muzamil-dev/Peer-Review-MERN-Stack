import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application/src/groups/userGroups.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:flutter_application/src/reviews/student_review.dart';
import 'package:intl/intl.dart';
import "package:http/http.dart" as http;
import "dart:convert";

class UserDashboard extends StatefulWidget {
  final dynamic token;
  final int workspaceId;
  static const routeName = "/userDashboard";

  const UserDashboard({
    required this.token,
    required this.workspaceId,
    super.key,
  });

  @override
  State<UserDashboard> createState() => _UserDashboardState();
}

class _UserDashboardState extends State<UserDashboard> {
  late int userId;
  String userName = '';
  List<Object> assignments = [];
  List<String> deadlines = [];
  int _currentIndex = 0;
  int totalItemsLeft = 0;
  Map<int, int> itemsLeft = {};
  Map<int, Object> incompleteReviews = {};
  Map<int, Object> completedReviews = {};

  // Initializes User Name and assignments variables upon page load
  @override
  initState() {
    super.initState();
    Map<String, dynamic> jwtDecodedToken = JwtDecoder.decode(widget.token);
    userId = jwtDecodedToken['userId'];
    getUser(context);
    getAllAssignments(context);
  }

  // Gets Current User Information
  Future<void> getUser(BuildContext context) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/$userId');
    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer ${widget.token}',
      });

      if (response.statusCode == 200) {
        print("Got User Successfully!");
        final jsonResponse = json.decode(response.body);
        setState(() {
          userName = jsonResponse['firstName'] + ' ' + jsonResponse['lastName'];
        });
      }
    } catch (error) {
      print("Error Getting User: $error");
    }
  }

  // Gets All Assignments in the Given Workspace
  Future<void> getAllAssignments(BuildContext context) async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/assignments');
    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer ${widget.token}',
      });

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        var now = DateTime.now();

        setState(() {
          for (var response in jsonResponse) {
            var parsedDate = DateTime.parse(response["dueDate"]);
            // Checks if the Current Assignment is Past the Due Date
            if (parsedDate.isAfter(now)) {
              assignments.add(response);
              deadlines.add(getDateString(response["dueDate"]));
              getAssignmentProgress(context, response['assignmentId']);
            }
          }
        });
      }
    } catch (error) {
      print("Error Getting Workspace Assignments: $error");
    }
  }

  Future<void> getAssignmentProgress(
      BuildContext context, int assignmentId) async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/assignments/$assignmentId/user/$userId');
    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer ${widget.token}',
      });

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (mounted) {
          setState(() {
            itemsLeft[assignmentId] = jsonResponse["incompleteReviews"].length;
            totalItemsLeft += (jsonResponse["incompleteReviews"].length as int);
            incompleteReviews[assignmentId] = jsonResponse["incompleteReviews"];
            completedReviews[assignmentId] = jsonResponse["completedReviews"];
          });
        }
      }
    } catch (error) {
      print("Error Getting Assignment Progress: $error");
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

  // Widget List Function to navigate between Bottom navigation bar items
  List<Widget> _widgetTabOptions(BuildContext context) {
    return <Widget>[toDoPage(context), profilePage(context)];
  }

  // Widget for To do List Page
  Widget toDoPage(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Column(
              children: [
                Text(
                  "Welcome $userName!",
                  style: const TextStyle(fontSize: 25.0),
                ),
                Text("You Have $totalItemsLeft reviews to complete!"),
              ],
            ),
          ),
          const SizedBox(
            height: 15,
          ),
          const Text(
            "Assignments",
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
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
                    itemCount: assignments.length)),
          ),
        ],
      ),
    );
  }

  Widget assignmentItem(BuildContext context, index) {
    var currentAssignment = assignments[index];
    int currentAssignmentId = (currentAssignment as Map)["assignmentId"];

    // Checking to make sure the current assignment has non null items
    if (itemsLeft[currentAssignmentId] != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ExpansionTile(
            leading: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                statusIcon(context, (itemsLeft[currentAssignmentId] ?? -1)),
              ],
            ),
            title: Text(
              "${currentAssignment['name']}",
              style: const TextStyle(fontSize: 25),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Deadline: ${deadlines[index]}"),
                const SizedBox(
                  height: 10,
                ),
                Text(
                  "Items To Do: ${itemsLeft[currentAssignmentId]}",
                  style: const TextStyle(fontSize: 17),
                ),
              ],
            ),
            children: [
              assignmentLinks(context, currentAssignmentId),
            ],
          ),
        ],
      );
    } else {
      return const SizedBox();
    }
  }

  Widget assignmentLinks(BuildContext context, int currentAssignmentId) {
    List assignmentReviews;

    // Allows for Editing of Existing reviews for Users that have completed an assignment
    if (itemsLeft[currentAssignmentId] == 0) {
      assignmentReviews = (completedReviews[currentAssignmentId] as List);
    } else {
      assignmentReviews = (incompleteReviews[currentAssignmentId] as List);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: assignmentReviews.map<Widget>((review) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircleAvatar(
              radius: 3,
              backgroundColor: Colors.black,
            ),
            TextButton(
                onPressed: () {
                  navigateToStudentReview(userId, review["targetId"],
                      currentAssignmentId, review["reviewId"]);
                },
                child: reviewText(context, review, currentAssignmentId)),
          ],
        );
      }).toList(),
    );
  }

  Widget reviewText(
      BuildContext context, dynamic review, int currentAssignmentId) {
    if (itemsLeft[currentAssignmentId] == 0) {
      return Text(
          "Edit Review for ${review["firstName"]} ${review["lastName"]}");
    } else {
      return Text(
          "Complete Review for ${review["firstName"]} ${review["lastName"]}");
    }
  }

  void navigateToStudentReview(
      int userId, int targetUserId, int assignmentId, int reviewId) async {
    await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => StudentReview(
            token: widget.token,
            userId: userId,
            targetUserId: targetUserId,
            assignmentId: assignmentId,
            reviewId: reviewId,
          ),
        ));

    // Resets Assignments list upon returning back from review page
    setState(() {
      assignments = [];
      totalItemsLeft = 0;
      getAllAssignments(context);
    });
  }

  void navigateToGroupsPage() async {
    await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => UserGroup(
            token: widget.token,
            userId: userId,
            workspaceId: widget.workspaceId,
          ),
        ));

    // Resets Assignments list upon returning back from review page
    setState(() {
      assignments = [];
      totalItemsLeft = 0;
      getAllAssignments(context);
    });
  }

  Widget statusIcon(BuildContext context, int itemsLeft) {
    if (itemsLeft == 0) {
      return const CircleAvatar(
        radius: 20,
        backgroundColor: Colors.green,
        child: IconButton(
          onPressed: null,
          icon: Icon(
            Icons.check,
            color: Colors.white,
            size: 20,
          ),
        ),
      );
    } else {
      return const CircleAvatar(
        radius: 20,
        backgroundColor: Colors.red,
        child: IconButton(
          onPressed: null,
          icon: Icon(
            Icons.close,
            color: Colors.white,
            size: 20,
          ),
        ),
      );
    }
  }

  // Widget for Profile Display Page
  Widget profilePage(BuildContext context) {
    return const Column(
      children: [
        Text("Student Profile Page"),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Dashboard"),
              IconButton(
                  onPressed: navigateToGroupsPage,
                  icon: const Column(
                    children: [
                      Icon(Icons.group),
                      Text("View Groups"),
                    ],
                  ))
            ],
          ),
          backgroundColor: const Color(0xFF9bc4bc),
        ),
        body: _widgetTabOptions(context).elementAt(_currentIndex),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.assignment), label: 'To Do'),
            BottomNavigationBarItem(
              icon: Icon(CupertinoIcons.profile_circled),
              label: 'Profile',
            ),
          ],
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
        ));
  }
}
