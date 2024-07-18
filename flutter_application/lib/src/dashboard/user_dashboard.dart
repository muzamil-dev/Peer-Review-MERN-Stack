import 'package:flutter/material.dart';
import 'package:flutter_application/src/groups/userGroups.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:flutter_application/src/reviews/student_review.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:intl/intl.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_svg/flutter_svg.dart';

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
  bool isWorkspaceLocked = false;
  bool isLoading = true;
  Map<int, int> itemsLeft = {};
  Map<int, Object> incompleteReviews = {};
  Map<int, Object> completedReviews = {};
  final apiInstance = Api();
  final storage = const FlutterSecureStorage();

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
    final url = ('/users/$userId');

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        print("Got User Successfully!");
        final jsonResponse = response.data;
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
    final url = '/workspaces/${widget.workspaceId}/assignments';

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        var now = DateTime.now();
        await getLockedStatus(context);

        for (var response in jsonResponse) {
          var parsedDate = DateTime.parse(response["dueDate"]);
          // Checks if the Current Assignment is Past the Due Date
          if (parsedDate.isAfter(now)) {
            assignments.add(response);
            deadlines.add(getDateString(response["dueDate"]));
            await getAssignmentProgress(context, response['assignmentId']);
          }
        }
        setState(() {
          isLoading = false;
        });
      }
    } catch (error) {
      print("Error Getting Workspace Assignments: $error");
    }
  }

  Future<void> getAssignmentProgress(
      BuildContext context, int assignmentId) async {
    final url = '/assignments/$assignmentId/user/$userId';

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        if (mounted) {
          if (jsonResponse["incompleteReviews"] != null) {
            setState(() {
              itemsLeft[assignmentId] =
                  jsonResponse["incompleteReviews"].length;
              totalItemsLeft +=
                  ((jsonResponse["incompleteReviews"]).length as int);
              incompleteReviews[assignmentId] =
                  jsonResponse["incompleteReviews"];
              completedReviews[assignmentId] = jsonResponse["completedReviews"];
            });
          }
        }
      }
    } catch (error) {
      print("Error Getting Assignment Progress: $error");
    }
  }

  Future<void> getLockedStatus(BuildContext context) async {
    final url = '/workspaces/${widget.workspaceId}';

    try {
      final response = await apiInstance.api.get(url);
      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        setState(() {
          isWorkspaceLocked = jsonResponse['groupLock'];
        });
      }
    } catch (error) {
      print("Error Getting Locked Status: $error");
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
  List<Widget> _widgetTabBodyOptions(BuildContext context) {
    return <Widget>[toDoPage(context), groupPage(context)];
  }

  List<PreferredSizeWidget> _widgetTabAppBarOptions(BuildContext context) {
    return <PreferredSizeWidget>[toDoAppBar(context), profileAppBar(context)];
  }

  Widget lockWidget(BuildContext context) {
    if (isWorkspaceLocked) {
      return TextButton(
          onPressed: null,
          style: TextButton.styleFrom(
            backgroundColor: Colors.redAccent,
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Text(
                'Workspace: Locked',
                style: TextStyle(
                  color: Colors.white,
                ),
              ),
              SizedBox(
                width: 10,
              ),
              Icon(
                Icons.lock,
                color: Colors.white,
              ),
            ],
          ));
    }
    return TextButton(
        onPressed: null,
        style: TextButton.styleFrom(
          backgroundColor: Colors.green,
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Text(
              'Workspace: Unlocked',
              style: TextStyle(
                color: Colors.white,
              ),
            ),
            SizedBox(
              width: 10,
            ),
            Icon(
              Icons.lock_open,
              color: Colors.white,
            ),
          ],
        ));
  }

  PreferredSizeWidget toDoAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xff004080),
      iconTheme: const IconThemeData(
        color: Colors.white,
      ),
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
              "Dashboard",
              style: TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      centerTitle: true,
    );
  }

  PreferredSizeWidget profileAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xff004080),
      iconTheme: const IconThemeData(
        color: Colors.white,
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(
            width: 60,
          ),
          SvgPicture.asset(
            'assets/images/RMP_Icon.svg',
            width: 30,
            height: 35,
          ),
          const Text(
            "Groups",
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
      centerTitle: true,
    );
  }

  // Widget for To do List Page
  Widget toDoPage(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    } else {
      return Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  Text(
                    "Welcome $userName!",
                    style: const TextStyle(
                        fontSize: 28.0,
                        overflow: TextOverflow.ellipsis,
                        color: Colors.white,
                        fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "You Have $totalItemsLeft reviews to complete!",
                    style: const TextStyle(fontSize: 18, color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(
              height: 30,
            ),
            Container(
              margin: const EdgeInsets.fromLTRB(5.0, 0, 0, 0),
              child: const Text(
                "Assignments",
                style: TextStyle(
                  fontSize: 35,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            toDoPageBody(),
          ],
        ),
      );
    }
  }

  Widget toDoPageBody() {
    if (assignments.isEmpty) {
      return Expanded(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            const SizedBox(
              height: 20,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  child: const Text(
                    "No Assignments To Display",
                    style: TextStyle(fontSize: 20),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    } else {
      return Expanded(
        child: RawScrollbar(
            thumbColor: Colors.black45,
            child: ListView.separated(
                itemBuilder: (context, index) {
                  return Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12.0),
                      ),
                      child: assignmentItem(context, index));
                },
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 10.0), // Space between items

                itemCount: assignments.length)),
      );
    }
  }

  Widget assignmentItem(BuildContext context, index) {
    var currentAssignment = assignments[index];
    int currentAssignmentId = (currentAssignment as Map)["assignmentId"];

    // Checking to make sure the current assignment has non null items
    if (itemsLeft[currentAssignmentId] != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
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
          ),
          const SizedBox(
            height: 10,
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
      return Card(
        child: Container(
          padding: const EdgeInsets.all(12.0),
          decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.black, width: 1),
              borderRadius: BorderRadius.circular(12.0)),
          child: Text(
            "Edit Review for ${review["firstName"]} ${review["lastName"]}",
            style: const TextStyle(
                color: Colors.black, fontWeight: FontWeight.w400),
          ),
        ),
      );
    } else {
      return Text(
        "Complete Review for ${review["firstName"]} ${review["lastName"]}",
        style: const TextStyle(color: Colors.black),
      );
    }
  }

  void navigateToStudentReview(
      int userId, int targetUserId, int assignmentId, int reviewId) async {
    await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => StudentReview(
            userId: userId,
            targetUserId: targetUserId,
            assignmentId: assignmentId,
            reviewId: reviewId,
          ),
        ));

    // Resets Assignments list upon returning back from review page
    setState(() {
      isLoading = true;
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
  Widget groupPage(BuildContext context) {
    return UserGroup(workspaceId: widget.workspaceId, userId: userId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: _widgetTabAppBarOptions(context).elementAt(_currentIndex),
        body: _widgetTabBodyOptions(context).elementAt(_currentIndex),
        backgroundColor: const Color(0xFF004080),
        bottomNavigationBar: BottomNavigationBar(
          backgroundColor: Colors.white,
          elevation: 8.0,
          fixedColor: const Color(0xff004080),
          selectedIconTheme: const IconThemeData(
            color: Color(0xff004080),
          ),
          unselectedItemColor: Colors.black54,
          currentIndex: _currentIndex,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.assignment), label: 'To Do'),
            BottomNavigationBarItem(
              icon: Icon(Icons.group),
              label: 'Groups',
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
