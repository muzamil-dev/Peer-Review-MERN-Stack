import 'package:flutter/material.dart';
import 'package:flutter_application/src/profile/linechart.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AnalyticsPage extends StatefulWidget {
  final int targetId;
  final int workspaceId;
  final int userId;
  static const routeName = "/analytics";

  const AnalyticsPage(
      {required this.targetId,
      required this.userId,
      required this.workspaceId,
      super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  String userName = '';
  List<double> averageRatings = [];
  List<String> assignmentNames = [];
  int _currentIndex = 0;
  final storage = const FlutterSecureStorage();
  final apiInstance = Api();

  @override
  void initState() {
    super.initState();
    getAnalyticsForUser();
  }

  Future<void> getAnalyticsForUser() async {
    final url =
        "/analytics/workspace/${widget.workspaceId}/user/${widget.targetId}";

    try {
      final response = await apiInstance.api.get(url);
      if (response.statusCode == 200) {
        final jsonResponse = response.data;
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
      } else if (response.statusCode == 404) {
        print("Error Getting Analytics");
      } else {
        final error = response.data;
        print("Error: $error");
      }
    } catch (error) {
      print("Error Getting Analytics for User: $error");
    }
  }

  Future<void> getAssignmentInfo(
      int assignmentId, List<String> assignmentNames) async {
    final url = '/assignments/$assignmentId';

    try {
      final response = await apiInstance.api.get(
        url,
      );
      if (response.statusCode == 200) {
        final jsonResponse = response.data;
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
      return const DataCell(Text(
        "None",
        style: TextStyle(fontSize: 18),
      ));
    } else {
      return DataCell(Text(
        "$rating",
        style: const TextStyle(fontSize: 18),
      ));
    }
  }

  Widget tablePage() {
    if (assignmentNames.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12.0),
              ),
              child: const SizedBox(
                height: 250,
                width: 500,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      children: [
                        Text(
                          "No Assignments Completed",
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 28,
                          ),
                        )
                      ],
                    ),
                    Text(
                      "No Data To Display",
                      style: TextStyle(
                        fontWeight: FontWeight.w400,
                        fontSize: 28,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.all(10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(
              height: 40,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.fromLTRB(12.0, 0, 0, 0),
                  child: const Text(
                    "Completed Assignments",
                    style: TextStyle(
                        fontSize: 32.0,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                ),
              ],
            ),
            const SizedBox(
              height: 10,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  child: Container(
                    padding: const EdgeInsets.all(8.0),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.black, width: 1)),
                    child: RawScrollbar(
                      thumbColor: Colors.black,
                      child: DataTable(
                        columns: const [
                          DataColumn(
                              label: Text(
                            "Name",
                            style: TextStyle(
                                fontSize: 20, fontWeight: FontWeight.w600),
                          )),
                          DataColumn(
                              label: Text(
                            "Average Rating",
                            style: TextStyle(
                                fontSize: 20, fontWeight: FontWeight.w600),
                          )),
                        ],
                        rows: assignmentNames.asMap().entries.map((entry) {
                          int idx = entry.key;
                          String name = entry.value;
                          double rating = averageRatings[idx];

                          return DataRow(cells: [
                            DataCell(Text(
                              name,
                              style: const TextStyle(
                                fontSize: 18,
                                overflow: TextOverflow.ellipsis,
                              ),
                            )),
                            tableRatingDisplay(rating),
                          ]);
                        }).toList(),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }
  }

  Widget graphPage() {
    return Container(
      color: const Color(0xFF004080),
      height: MediaQuery.of(context).size.height,
      width: MediaQuery.of(context).size.width,
      padding: const EdgeInsets.all(20.0),
      child: Center(
        child: LineChartWidget(
            assignmentNames: assignmentNames,
            assignmentRatings: averageRatings),
      ),
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
                "Analytics Page",
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
        centerTitle: true,
        backgroundColor: const Color(0xFF004080),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _widgetTabOptions(context).elementAt(_currentIndex),
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
