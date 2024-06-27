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
  bool groupLock = false;
  final String adminUserId = '6671c8362ffea49f3018bf61'; // Replace with actual admin user ID

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

  Future<void> fetchWorkspaceDetails() async {
    final workspaceDetailsUrl = Uri.parse('http://10.0.2.2:5000/workspaces/${widget.workspaceId}/details');
    try {
      final response = await http.get(workspaceDetailsUrl);
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        setState(() {
          workspaceName = responseData['name'];
          groupLock = responseData['groupLock'];
        });
      } else {
        throw Exception('Failed to load workspace details');
      }
    } catch (error) {
      print('Error fetching workspace details: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load workspace details')),
      );
    }
  }

  Future<void> fetchWorkspaceName() async {
    await fetchWorkspaceDetails();
  }

  Future<void> fetchGroups() async {
    final groupsUrl = Uri.parse('http://10.0.2.2:5000/workspaces/${widget.workspaceId}/groups');
    try {
      final groupsResponse = await http.get(groupsUrl);
      if (groupsResponse.statusCode == 200) {
        final responseData = json.decode(groupsResponse.body);
        setState(() {
          currentGroups = (responseData['groups'] as List<dynamic>).map((group) => Group.fromJson(group)).toList();
          groupLock = responseData['groupLock'];
        });
      } else {
        throw Exception('Failed to load groups');
      }
    } catch (error) {
      print('Error fetching groups: $error');
    }
  }

  Future<void> fetchUngroupedStudents() async {
    final url = Uri.parse('http://10.0.2.2:5000/workspaces/${widget.workspaceId}/ungrouped');
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          ungroupedStudents = data.map((student) => Student.fromJson(student)).toList();
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
          'userId': adminUserId,
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

  Future<void> addStudentToGroup(String userId, String groupId) async {
    final addUserUrl = Uri.parse('http://10.0.2.2:5000/groups/addUser');
    try {
      final response = await http.put(
        addUserUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'userId': adminUserId,
          'targetId': userId,
          'groupId': groupId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Student added to the group successfully')),
        );
        fetchGroupsAndStudents(); // Refresh groups and ungrouped students
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error adding student to group: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding student to group')),
      );
    }
  }

  Future<void> removeStudentFromGroup(String userId, String groupId) async {
    final removeUserUrl = Uri.parse('http://10.0.2.2:5000/groups/removeUser');
    try {
      final response = await http.put(
        removeUserUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'userId': adminUserId,
          'targetId': userId,
          'groupId': groupId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Student removed from the group successfully')),
        );
        fetchGroupsAndStudents(); // Refresh groups and ungrouped students
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error removing student from group: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error removing student from group')),
      );
    }
  }

  void showMoveStudentDialog(Student student, {String? currentGroupId}) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Edit Student'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (currentGroupId != null ) // Only show "Kick" if the student is in a group
                ListTile(
                  title: Text('Kick from Group', style: TextStyle(color: Colors.red)),
                  onTap: () {
                    removeStudentFromGroup(student.userId, currentGroupId);
                    Navigator.of(context).pop();
                  },
                ),
              ...currentGroups.map((group) => ListTile(
                title: Text(group.name),
                onTap: () {
                  if (currentGroupId != null) {
                    // Remove from current group and add to the new group
                    removeStudentFromGroup(student.userId, currentGroupId).then((_) {
                      addStudentToGroup(student.userId, group.groupId);
                    });
                  } else {
                    // Just add to the new group
                    addStudentToGroup(student.userId, group.groupId);
                  }
                  Navigator.of(context).pop();
                },
              )).toList(),
              ListTile(
                title: Text('Kick from Workspace', style: TextStyle(color: Colors.red)),
                onTap: () {
                  kickStudent(student.userId);
                  Navigator.of(context).pop();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> kickStudent(String userId) async {
    final kickUrl = Uri.parse('http://10.0.2.2:5000/workspaces/leave');
    try {
      final response = await http.put(
        kickUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'userId': userId,
          'workspaceId': widget.workspaceId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Student kicked from the workspace successfully')),
        );
        fetchGroupsAndStudents(); // Refresh groups and ungrouped students
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error kicking student from workspace: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error kicking student from workspace')),
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
        'userId': adminUserId,
      }),
    );
    if (response.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Group added successfully')),
      );
      await fetchGroupsAndStudents(); // Refresh groups and ungrouped students immediately after adding a group
    } else {
      print('Failed to add group. Status code: ${response.statusCode}');
    }
  } catch (error) {
    print('Error adding group: $error');
  }
}

  void showEditWorkspaceDialog() {
    TextEditingController nameController = TextEditingController();
    TextEditingController domainsController = TextEditingController();
    TextEditingController limitController = TextEditingController();
  
    // Load the current workspace details
    final workspaceDetailsUrl = Uri.parse('http://10.0.2.2:5000/workspaces/${widget.workspaceId}/details');
    print('Fetching workspace details from: $workspaceDetailsUrl');
    http.get(workspaceDetailsUrl).then((response) {
      print('Workspace details response status: ${response.statusCode}');
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        print('Workspace details: $responseData');
        setState(() {
          nameController.text = responseData['name'];
          domainsController.text = (responseData['allowedDomains'] as List<dynamic>).join(', ');
          limitController.text = responseData['groupMemberLimit'].toString();
          groupLock = responseData['groupLock'];
        });
      } else {
        print('Failed to load workspace details: ${response.body}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load workspace details')),
        );
      }
    }).catchError((error) {
      print('Error fetching workspace details: $error');
    });
  
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text('Edit Workspace'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration: InputDecoration(labelText: 'Workspace Name'),
                    ),
                    TextField(
                      controller: domainsController,
                      decoration: InputDecoration(labelText: 'Allowed Domains (comma-separated)'),
                    ),
                    TextField(
                      controller: limitController,
                      decoration: InputDecoration(labelText: 'Group Member Limit'),
                      keyboardType: TextInputType.number,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Group Lock'),
                        Switch(
                          value: groupLock,
                          onChanged: (value) {
                            setState(() {
                              groupLock = value;
                            });
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () async {
                    await editWorkspace(
                      nameController.text,
                      domainsController.text.split(',').map((s) => s.trim()).toList(),
                      int.parse(limitController.text),
                      groupLock,
                    );
                    Navigator.of(context).pop();
                  },
                  child: Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> editWorkspace(String name, List<String> allowedDomains, int groupMemberLimit, bool groupLock) async {
    final editUrl = Uri.parse('http://10.0.2.2:5000/workspaces/edit');
    try {
      final response = await http.put(
        editUrl,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, dynamic>{
          'userId': '6671c8362ffea49f3018bf61',  // Replace with actual admin user ID
          'workspaceId': widget.workspaceId,
          'name': name,
          'allowedDomains': allowedDomains,
          'groupMemberLimit': groupMemberLimit,
          'groupLock': groupLock,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Workspace updated successfully')),
        );
        fetchWorkspaceName(); // Refresh the workspace name
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error editing workspace: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error editing workspace')),
      );
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
        actions: [
          IconButton(
            icon: Icon(Icons.edit, color: Colors.white),
            onPressed: showEditWorkspaceDialog,
          ),
        ],
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
                                          ),
                                          currentGroupId: group.groupId,);
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
  String groupId;
  String name;
  List<Member> members;

  Group({
    required this.groupId,
    required this.name,
    required this.members,
  });

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      groupId: json['groupId'],
      name: json['name'],
      members: (json['members'] as List<dynamic>).map((member) => Member.fromJson(member)).toList(),
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
