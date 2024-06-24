import 'package:flutter/material.dart';

class AdminGroup extends StatefulWidget {
  final String workspaceId;

  const AdminGroup({super.key, required this.workspaceId});

  static const routeName = "/adminGroup";

  @override
  _AdminGroupState createState() => _AdminGroupState();
}

class _AdminGroupState extends State<AdminGroup> {
  // Example data for groups and students
  List<Map<String, dynamic>> groups = [
    {
      'groupName': "Group 1",
      'students': ['Student A', 'Student B', 'Student C'],
    },
    {
      'groupName': 'Group 2',
      'students': ['Student D', 'Student E'],
    },
    {
      'groupName': 'Group 3',
      'students': ['Student F', 'Student G', 'Student H'],
    },
  ];

  void moveStudent(int fromGroupIndex, int studentIndex) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Move Student'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: groups
                .asMap()
                .entries
                .map(
                  (entry) => ListTile(
                    title: Text(entry.value['groupName']),
                    onTap: () {
                      setState(() {
                        String student =
                            groups[fromGroupIndex]['students'][studentIndex];
                        groups[fromGroupIndex]['students']
                            .removeAt(studentIndex);
                        groups[entry.key]['students'].add(student);
                      });
                      Navigator.of(context).pop();
                    },
                  ),
                )
                .toList(),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Student Groups',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF004080),
        centerTitle: true,
      ),
      body: Container(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Workspace ID: ${widget.workspaceId}', // Display workspace ID here
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: groups.length,
                itemBuilder: (context, groupIndex) {
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 10),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            groups[groupIndex]['groupName'],
                            style: TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 10),
                          Column(
                            children: List.generate(
                                groups[groupIndex]['students'].length,
                                (studentIndex) {
                              return ListTile(
                                title: Text(groups[groupIndex]['students']
                                    [studentIndex]),
                                trailing: IconButton(
                                  icon: Icon(Icons.edit),
                                  onPressed: () {
                                    moveStudent(groupIndex, studentIndex);
                                  },
                                ),
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
