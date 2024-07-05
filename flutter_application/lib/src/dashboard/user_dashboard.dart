import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';
import "package:http/http.dart" as http;
import "dart:convert";

class UserDashboard extends StatefulWidget {
  final int userId;
  final int workspaceId;
  static const routeName = "/userDashboard";

  const UserDashboard({
    required this.userId,
    required this.workspaceId,
    super.key,
  });

  @override
  State<UserDashboard> createState() => _UserDashboardState();
}

class _UserDashboardState extends State<UserDashboard> {
  String userName = '';
  List<Object> assignments = [];
  int _currentIndex = 0;
  Map<int, int> itemsLeft = {};

  // Initializes User Name and assignments variables upon page load
  @override
  initState() {
    super.initState();
    getUser(context);
    getAllAssignments(context);
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
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        setState(() {
          for (var response in jsonResponse) {
            assignments.add(response);
            getAssignmentProgress(context, response['assignmentId']);
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
        'http://10.0.2.2:5000/assignments/$assignmentId/user/${widget.userId}');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (mounted) {
          setState(() {
            itemsLeft[assignmentId] = jsonResponse["incompleteReviews"].length;
          });
        }
      }
    } catch (error) {
      print("Error Getting Assignment Progress: $error");
    }
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
          Text(
            "Welcome $userName!",
            style: const TextStyle(fontSize: 25.0),
          ),
          const SizedBox(
            height: 15,
          ),
          const Text(
            "Assignments",
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
          ),
          const SizedBox(
            height: 10,
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

    return Container(
      decoration:
          BoxDecoration(border: Border.all(width: 3, color: Colors.black)),
      padding: const EdgeInsets.all(8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "${currentAssignment['name']}",
                style: const TextStyle(fontSize: 25),
              ),
              Row(
                children: [
                  const Text(
                    "Status: ",
                    style: TextStyle(fontSize: 18),
                  ),
                  statusIcon(context, (itemsLeft[currentAssignmentId] ?? -1)),
                ],
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Items Left to Complete: ${itemsLeft[currentAssignmentId]}",
                style: const TextStyle(fontSize: 17),
              ),
              const IconButton(
                  onPressed: null, icon: Icon(Icons.arrow_drop_down)),
            ],
          )
        ],
      ),
    );
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
    return Column(
      children: [
        Text("Welcome $userName"),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: const MainAppBar(
          title: "Dashboard",
          backgroundColor: Color(0xFF9bc4bc),
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
