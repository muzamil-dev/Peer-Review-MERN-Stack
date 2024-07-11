import 'package:flutter/material.dart';
import "package:http/http.dart" as http;
import "dart:convert";
import 'package:flutter_application/src/profile/linechart.dart';

class AnalyticsPage extends StatefulWidget {
  final int targetId;
  final int workspaceId;
  final int userId;
  final dynamic token;
  static const routeName = "/analytics";

  const AnalyticsPage(
      {required this.targetId,
      required this.userId,
      required this.workspaceId,
      required this.token,
      super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  String userName = '';
  List<double> averageRatings = [];
  List<String> assignmentNames = [];
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    print("Token: ${widget.token}");
    getAnalyticsForUser();
  }

  Future<void> getAnalyticsForUser() async {
    final url = Uri.parse(
        "http://10.0.2.2:5000/analytics/workspace/${widget.workspaceId}/user/${widget.targetId}");

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
      );
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        List<String> tempAssignmentNames = [];

        for (var response in jsonResponse["assignments"]) {
          await getAssignmentInfo(
              response["assignmentId"], tempAssignmentNames);
          setState(() {
            if (response["averageRating"] != null) {
              averageRatings.add(response["averageRating"].toDouble());
            } else {
              averageRatings.add(-1.0);
            }
            assignmentNames = tempAssignmentNames;
          });
        }
        print(assignmentNames);
        print(averageRatings);
      } else {
        final error = json.decode(response.body);
        print("Error: $error");
      }
    } catch (error) {
      print("Error Getting Analytics for User: $error");
    }
  }

  Future<void> getAssignmentInfo(
      int assignmentId, List<String> assignmentNames) async {
    final url = Uri.parse('http://10.0.2.2:5000/assignments/$assignmentId');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
      );
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        print(jsonResponse);
        assignmentNames.add(jsonResponse["name"]);
      } else {
        print("error: ");
      }
    } catch (error) {
      print("Error Getting Assignment Info: $error");
    }
  }

  DataCell tableRatingDisplay(double rating) {
    if (rating == -1) {
      return const DataCell(Text("None"));
    } else {
      return DataCell(Text("$rating"));
    }
  }

  Widget tablePage() {
    return Container(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "Assignments Vs Average Rating",
                style: TextStyle(fontSize: 22.0),
              ),
            ],
          ),
          DataTable(
            columns: const [
              DataColumn(label: Text("")),
              DataColumn(label: Text("Name")),
              DataColumn(label: Text("Average Rating")),
            ],
            rows: assignmentNames.asMap().entries.map((entry) {
              int idx = entry.key;
              String name = entry.value;
              double rating = averageRatings[idx];

              return DataRow(cells: [
                DataCell(Text("${idx + 1}")),
                DataCell(Text(name)),
                tableRatingDisplay(rating),
              ]);
            }).toList(),
          )
        ],
      ),
    );
  }

  Widget graphPage() {
    return Container(
      color: Colors.black12,
      height: MediaQuery.of(context).size.height,
      width: MediaQuery.of(context).size.width,
      child: const LineChartWidget(),
    );
  }

  // Widget List Function to navigate between Bottom navigation bar items
  List<Widget> _widgetTabOptions(BuildContext context) {
    return <Widget>[tablePage(), graphPage()];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Analytics",
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        backgroundColor: const Color(0xFF004080),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _widgetTabOptions(context).elementAt(_currentIndex),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.table_chart), label: 'Table'),
          BottomNavigationBarItem(
            icon: Icon(Icons.line_axis),
            label: 'Graph',
          ),
        ],
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }
}
