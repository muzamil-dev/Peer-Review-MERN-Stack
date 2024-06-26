import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class AdminGroup extends StatefulWidget {
  final String workspaceId;

  const AdminGroup({super.key, required this.workspaceId});

  static const routeName = "/adminGroup";

  @override
  _AdminGroupState createState() => _AdminGroupState();
}

class _AdminGroupState extends State<AdminGroup> {
  List<Group> currentGroups = [];
  List<Student> ungroupedStudents = [];
  bool isLoading = true;
  String workspaceName = '';

  @override
  void initState() {
    super.initState();
    fetchWorkspaceName();
    fetchGroupsAndStudents();
  }

  Future<void> fetchGroupsAndStudents() async {
    await fetchGroups();
    await fetchUngroupedStudents();
    setState(() {
      isLoading = false;
    });
  }

  Future<void> fetchWorkspaceName() async {
    final nameUrl =
        Uri.parse('http://10.0.2.2:5000/workspaces/${widget.workspaceId}/name');
    try {
      final response = await http.get(nameUrl);
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        setState(() {
          workspaceName = responseData['name'];
        });
      } else {
        throw Exception('Failed to load workspace name');
      }
    } catch (error) {
      print('Error fetching workspace name: $error');
    }
  }

  Future<void> fetchGroups() async {
    final groupsUrl = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/groups');
    try {
      final groupsResponse = await http.get(groupsUrl);
      if (groupsResponse.statusCode == 200) {
        final List<dynamic> groupsData = json.decode(groupsResponse.body);
        setState(() {
          currentGroups =
              groupsData.map((group) => Group.fromJson(group)).toList();
        });
      } else {
        throw Exception('Failed to load groups');
      }
    } catch (error) {
      print('Error fetching groups: $error');
    }
  }

  Future<void> fetchUngroupedStudents() async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/studentsWithoutGroup');
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          ungroupedStudents =
              data.map((student) => Student.fromJson(student)).toList();
        });
      } else {
        throw Exception('Failed to load ungrouped students');
      }
    } catch (error) {
      print('Error fetching ungrouped students: $error');
    }
  }

  Future<void> deleteGroup(String groupId) async {
    final deleteUrl = Uri.parse('http://10.0.2.2:5000/groups/$groupId');
    try {
      final response = await http.delete(
        deleteUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'userId': '6671c8362ffea49f3018bf61',
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Group deleted successfully')),
        );
        await fetchGroups(); // Refresh groups after deletion
        await fetchUngroupedStudents(); // Refresh ungrouped students after deletion
      } else {
        print('Failed to delete group. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error deleting group: $error');
    }
  }

  void showMoveStudentDialog(Student student) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Move Student'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: currentGroups
                .map((group) => ListTile(
                      title: Text(group.name),
                      onTap: () {
                        moveGroup(student.userId, group.groupId);
                        Navigator.of(context).pop();
                      },
                    ))
                .toList(),
          ),
        );
      },
    );
  }

  Future<void> moveGroup(String userId, String toGroupId) async {
    final moveUrl = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/moveStudentToGroup');
    try {
      final response = await http.put(
        moveUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'studentId': userId,
          'groupId': toGroupId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Student moved to the group successfully')),
        );
        fetchGroupsAndStudents(); // Refresh groups and ungrouped students
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error moving student to group: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error moving student to group')),
      );
    }
  }

  void showAddGroupDialog() async {
    await addGroup(); // Automatically add group with generated name
  }

  Future<void> addGroup() async {
    final Uri url = Uri.parse('http://10.0.2.2:5000/groups/create');
    try {
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
      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Group added successfully')),
        );
        fetchGroups(); // Refresh groups
      } else {
        print('Failed to add group. Status code: ${response.statusCode}');
      }
    } catch (error) {
      print('Error adding group: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF004080),
      appBar: AppBar(
        title: Text(
          workspaceName.isEmpty ? 'Loading...' : workspaceName,
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
          : Column(
              children: [
                // Container to list ungrouped students
                Expanded(
                  child: ListView(
                    children: [
                      Card(
                        margin: const EdgeInsets.all(10),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ungrouped Students',
                                style: TextStyle(
                                    fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              SizedBox(height: 10),
                              ListView.builder(
                                shrinkWrap: true,
                                itemCount: ungroupedStudents.length,
                                itemBuilder: (context, index) {
                                  final student = ungroupedStudents[index];
                                  return ListTile(
                                    title: Text(
                                        '${student.firstName} ${student.lastName}'),
                                    subtitle: Text(student.email),
                                    trailing: IconButton(
                                      icon: Icon(Icons.edit),
                                      onPressed: () {
                                        showMoveStudentDialog(student);
                                      },
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Rest of the groups
                      ...currentGroups.map((group) {
                        return Card(
                          margin: const EdgeInsets.all(10),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      group.name,
                                      style: TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold),
                                    ),
                                    IconButton(
                                      icon: Icon(Icons.delete),
                                      onPressed: () {
                                        deleteGroup(group.groupId);
                                      },
                                    ),
                                  ],
                                ),
                                SizedBox(height: 10),
                                Column(
                                  children: group.members.map((member) {
                                    return ListTile(
                                      title: Text(
                                          '${member.firstName} ${member.lastName}'),
                                      trailing: IconButton(
                                        icon: Icon(Icons.edit),
                                        onPressed: () {
                                          showMoveStudentDialog(Student(
                                            userId: member.userId,
                                            email:
                                                '', // Assuming email is not available in Member
                                            firstName: member.firstName,
                                            lastName: member.lastName,
                                          ));
                                        },
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ],
                  ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: showAddGroupDialog,
        child: Icon(Icons.add),
        backgroundColor: Color.fromARGB(255, 117, 147, 177),
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

  Member(
      {required this.userId, required this.firstName, required this.lastName});

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

  Group(
      {required this.name,
      required this.workspaceId,
      required this.groupId,
      required this.members});

  factory Group.fromJson(Map<String, dynamic> json) {
    List<Member> members = (json['members'] as List<dynamic>)
        .map((member) => Member.fromJson(member))
        .toList();

    return Group(
      name: json['name'],
      workspaceId: json['workspaceId'],
      groupId: json['groupId'],
      members: members,
    );
  }
}

class Student {
  String userId;
  String email;
  String firstName;
  String lastName;

  Student(
      {required this.userId,
      required this.email,
      required this.firstName,
      required this.lastName});

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      userId: json['userId'],
      email: json['email'],
      firstName: json['firstName'],
      lastName: json['lastName'],
    );
  }
}
