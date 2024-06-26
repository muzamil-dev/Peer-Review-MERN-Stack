import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class AdminGroup extends StatefulWidget {
  final String workspaceId;
  static const routeName = '/adminGroups';

  const AdminGroup({super.key, required this.workspaceId});

  @override
  _AdminGroupState createState() => _AdminGroupState();
}

class _AdminGroupState extends State<AdminGroup> {
  late Workspace currentWorkspace;
  List<Group> currentGroups = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchGroups(widget.workspaceId);
  }

  Future<void> fetchGroups(String workspaceId) async {
    final groupsUrl =
        Uri.parse('http://10.0.2.2:5000/workspaces/$workspaceId/groups');

    try {
      // Fetch groups data
      final groupsResponse = await http.get(groupsUrl);
      if (groupsResponse.statusCode != 200) {
        print(
            'Failed to load groups. Status code: ${groupsResponse.statusCode}');
        print('Response body: ${groupsResponse.body}');
        throw Exception('Failed to load groups');
      }

      print(groupsResponse.body);
      final List<dynamic> groupsData = json.decode(groupsResponse.body);

      final groups = groupsData.map((group) => Group.fromJson(group)).toList();
      setState(() {
        currentGroups = groups;
        isLoading = false;
      });
    } catch (error) {
      print('Error fetching workspace and groups: $error');
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> deleteGroup(String groupId) async {
    final deleteUrl = Uri.parse('http://10.0.2.2:5000/groups/$groupId');

    try {
      // Make the DELETE request
      final response = await http.delete(
        deleteUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'userId': '6671c8362ffea49f3018bf61',
        }),
      );

      // Check the response status
      if (response.statusCode == 200) {
        // Group deleted successfully
        print('Group deleted successfully');
        fetchGroups(widget.workspaceId); // Refresh groups after deletion
      } else {
        // Error occurred
        print('Failed to delete group. Status code: ${response.statusCode}');
      }
    } catch (error) {
      // Exception occurred
      print('Error deleting group: $error');
    }
  }

  void showMoveStudentDialog(
      String userId, int fromGroupIndex, int studentIndex) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Move Student'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: currentGroups
                .asMap()
                .entries
                .map(
                  (entry) => ListTile(
                    title: Text(entry.value.name),
                    onTap: () {
                      moveGroup(
                        userId, // Hardcoded user ID for demonstration
                        currentGroups[fromGroupIndex].groupId,
                        entry.value.groupId,
                      );
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

  Future<void> moveGroup(
      String userId, String fromGroupId, String toGroupId) async {
    final leaveUrl = Uri.parse('http://10.0.2.2:5000/groups/leave');
    final joinUrl = Uri.parse('http://10.0.2.2:5000/groups/join');

    try {
      // Leave the current group
      final leaveResponse = await http.put(
        leaveUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'userId': userId,
          'groupId': fromGroupId,
        }),
      );

      if (leaveResponse.statusCode != 200) {
        print(
            'Failed to leave group $fromGroupId. Status code: ${leaveResponse.statusCode}');
        return;
      }

      // Join the new group
      final joinResponse = await http.put(
        joinUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'userId': userId,
          'groupId': toGroupId,
        }),
      );

      if (joinResponse.statusCode != 200) {
        print(
            'Failed to join group $toGroupId. Status code: ${joinResponse.statusCode}');
        return;
      }

      // Refresh groups after moving
      fetchGroups(widget.workspaceId);
    } catch (error) {
      print('Error moving group: $error');
    }
  }

  void showAddGroupDialog() {
    TextEditingController groupNameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Add New Group'),
          content: TextField(
            controller: groupNameController,
            decoration: InputDecoration(hintText: 'Group Name'),
          ),
          actions: [
            TextButton(
              onPressed: () async {
                final groupName = groupNameController.text;
                if (groupName.isNotEmpty) {
                  await addGroup();
                  Navigator.of(context).pop();
                }
              },
              child: Text('Add'),
            ),
          ],
        );
      },
    );
  }

  Future<void> addGroup() async {
    // Define the URL
    final Uri url = Uri.parse('http://10.0.2.2:5000/groups/create');

    try {
      // Make the POST request
      final response = await http.post(
        url,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'workspaceId': widget.workspaceId,
          'userId': '6671c8362ffea49f3018bf61',
        }),
      );

      // Check the response status
      if (response.statusCode == 201) {
        // Group added successfully
        print('Group added successfully');
      } else {
        // Error occurred
        print('Failed to add group. Status code: ${response.statusCode}');
      }
    } catch (error) {
      // Exception occurred
      print('Error adding group: $error');
    }

    fetchGroups(widget.workspaceId);
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
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : Container(
              padding: const EdgeInsets.all(16.0),
              child: ListView.builder(
                itemCount: currentGroups.length,
                itemBuilder: (context, groupIndex) {
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 10),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                currentGroups[groupIndex].name,
                                style: TextStyle(
                                    fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              IconButton(
                                icon: Icon(Icons.delete),
                                onPressed: () {
                                  deleteGroup(
                                      currentGroups[groupIndex].groupId);
                                },
                              )
                            ],
                          ),
                          SizedBox(height: 10),
                          Column(
                            children: List.generate(
                              currentGroups[groupIndex].members.length,
                              (studentIndex) {
                                return ListTile(
                                  title: Text(currentGroups[groupIndex]
                                          .members[studentIndex]
                                          .firstName +
                                      ' ' +
                                      currentGroups[groupIndex]
                                          .members[studentIndex]
                                          .lastName),
                                  trailing: IconButton(
                                    icon: Icon(Icons.edit),
                                    onPressed: () {
                                      showMoveStudentDialog(
                                          currentGroups[groupIndex]
                                              .members[studentIndex]
                                              .userId,
                                          groupIndex,
                                          studentIndex);
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await addGroup();
        },
        child: Icon(Icons.add),
        backgroundColor: const Color(0xFF004080),
      ),
    );
  }
}

class Workspace {
  final String workspaceId;
  final String name;
  final String role;

  Workspace(
      {required this.workspaceId, required this.name, required this.role});

  factory Workspace.fromJson(Map<String, dynamic> json) {
    return Workspace(
      workspaceId: json['workspaceId'] ?? 'No ID',
      name: json['name'] ?? 'No name',
      role: json['role'] ?? 'No role',
    );
  }
}

class Member {
  String userId;
  String firstName;
  String lastName;

  Member({
    required this.userId,
    required this.firstName,
    required this.lastName,
  });

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      userId: json['userId'],
      firstName: json['firstName'],
      lastName: json['lastName'],
    );
  }
}

class Group {
  String name;
  String workspaceId;
  String groupId;
  List<Member> members;

  Group({
    required this.name,
    required this.workspaceId,
    required this.groupId,
    required this.members,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    List<dynamic> membersData = json['members'];
    List<Member> members =
        membersData.map((member) => Member.fromJson(member)).toList();

    return Group(
      name: json['name'],
      workspaceId: json['workspaceId'],
      groupId: json['groupId'],
      members: members,
    );
  }
}
