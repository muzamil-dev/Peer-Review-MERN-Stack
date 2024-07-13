import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_application/src/forms/get_forms.dart';
import 'package:flutter_application/src/profile/user_profile.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';


class AdminGroup extends StatefulWidget {
  final int workspaceId;
  final dynamic token;
  static const routeName = '/adminGroups';
  final int userId; // User ID of Account User

  const AdminGroup(
      {super.key,
      required this.token,
      required this.workspaceId,
      required this.userId});

  @override
  _AdminGroupState createState() => _AdminGroupState();
}

class _AdminGroupState extends State<AdminGroup> {
  List<Group> currentGroups = [];
  List<Student> ungroupedStudents = [];
  bool isLoading = true;
  String workspaceName = '';
  bool groupLock = false;
  final apiInstance = Api();
  final storage = const FlutterSecureStorage();

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
    final workspaceDetailsUrl =
        Uri.parse('http://10.0.2.2:5000/workspaces/${widget.workspaceId}');
    try {
      final response =
          await apiInstance.api.get('/workspaces/${widget.workspaceId}');
      if (response.statusCode == 200) {
        final responseData = response.data;
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
        const SnackBar(content: Text('Failed to load workspace details')),
      );
    }
  }

  Future<void> fetchWorkspaceName() async {
    await fetchWorkspaceDetails();
  }

  Future<void> fetchGroups() async {
    final groupsUrl = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/groups');


    try {
      final groupsResponse =
          await apiInstance.api.get('/workspaces/${widget.workspaceId}/groups');
      if (groupsResponse.statusCode == 200) {
        final responseData = groupsResponse.data;
        setState(() {
          currentGroups = (responseData['groups'] as List<dynamic>)
              .map((group) => Group.fromJson(group))
              .toList();
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
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/ungrouped');
    try {
      final response = await apiInstance.api
          .get('/workspaces/${widget.workspaceId}/ungrouped');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
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

  Future<void> deleteGroup(int groupId) async {
    final deleteUrl = Uri.parse('http://10.0.2.2:5000/groups/$groupId');


    try {
      final response = await apiInstance.api.delete(
        '/groups/$groupId',
        data: jsonEncode({
          'userId': widget.userId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group deleted successfully')),
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

  Future<void> addStudentToGroup(int userId, int groupId) async {
    final addUserUrl = Uri.parse('http://10.0.2.2:5000/groups/addUser');

    try {
      final response = await apiInstance.api.put(
        '/groups/addUser',
        data: jsonEncode({
          'userId': widget.userId,
          'targetId': userId,
          'groupId': groupId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Student added to the group successfully')),
        );
        fetchGroupsAndStudents(); // Refresh groups and ungrouped students
      } else {
        final errorData = response.data;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error adding student to group: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error adding student to group')),
      );
    }
  }

  Future<void> removeStudentFromGroup(int userId, int groupId) async {
    final removeUserUrl = Uri.parse('http://10.0.2.2:5000/groups/removeUser');

    try {
      final response = await apiInstance.api.put(
        '/groups/removeUser',
        data: jsonEncode({
          'userId': widget.userId,
          'targetId': userId,
          'groupId': groupId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Student removed from the group successfully')),
        );
        fetchGroupsAndStudents(); // Refresh groups and ungrouped students
      } else {
        final errorData = response.data;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error removing student from group: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error removing student from group')),
      );
    }
  }

  void showMoveStudentDialog(Student student, {int? currentGroupId}) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Edit Student'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (currentGroupId !=
                  null) // Only show "Kick" if the student is in a group
                ListTile(
                  title: const Text('Kick from Group',
                      style: TextStyle(color: Colors.red)),
                  onTap: () {
                    removeStudentFromGroup(student.userId, currentGroupId);
                    Navigator.of(context).pop();
                  },
                ),
              ...currentGroups
                  .map((group) => ListTile(
                        title: Text(group.name),
                        onTap: () {
                          if (currentGroupId != null) {
                            // Remove from current group and add to the new group
                            removeStudentFromGroup(
                                    student.userId, currentGroupId)
                                .then((_) {
                              addStudentToGroup(student.userId, group.groupId);
                            });
                          } else {
                            // Just add to the new group
                            addStudentToGroup(student.userId, group.groupId);
                          }
                          Navigator.of(context).pop();
                        },
                      ))
                  .toList(),
              ListTile(
                title: const Text('Kick from Workspace',
                    style: TextStyle(color: Colors.red)),
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

  Future<void> kickStudent(int userId) async {
    final kickUrl = Uri.parse('http://10.0.2.2:5000/workspaces/leave');

    try {
      final response = await apiInstance.api.put(
        '/workspaces/leave',
        data: jsonEncode({
          'userId': userId,
          'workspaceId': widget.workspaceId,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Student kicked from the workspace successfully')),
        );
        fetchGroupsAndStudents(); // Refresh groups and ungrouped students
      } else {
        final errorData = response.data;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error kicking student from workspace: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error kicking student from workspace')),
      );
    }
  }

  void showAddGroupDialog() async {
    await addGroup(); // Automatically add group with generated name
  }

  Future<void> addGroup() async {
    final Uri url = Uri.parse('http://10.0.2.2:5000/groups/create');

    try {
      final response = await apiInstance.api.post(
        '/groups/create',
        data: jsonEncode({
          'workspaceId': widget.workspaceId,
          'userId': widget.userId,
        }),
      );
      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group added successfully')),
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
    final workspaceDetailsUrl =
        Uri.parse('http://10.0.2.2:5000/workspaces/${widget.workspaceId}');
    print('Fetching workspace details from: $workspaceDetailsUrl');
    apiInstance.api.get('/workspaces/${widget.workspaceId}').then((response) {
      print('Workspace details response status: ${response.statusCode}');
      if (response.statusCode == 200) {
        final responseData = response.data;
        print('Workspace details: $responseData');
        setState(() {
          nameController.text = responseData['name'];
          domainsController.text =
              (responseData['allowedDomains'] as List<dynamic>).join(', ');
          limitController.text = responseData['groupMemberLimit'].toString();
          groupLock = responseData['groupLock'];
        });
      } else {
        print('Failed to load workspace details: ${response.data}');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load workspace details')),
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
              title: const Text('Edit Workspace'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration:
                          const InputDecoration(labelText: 'Workspace Name'),
                    ),
                    TextField(
                      controller: domainsController,
                      decoration: const InputDecoration(
                          labelText: 'Allowed Domains (comma-separated)'),
                    ),
                    TextField(
                      controller: limitController,
                      decoration: const InputDecoration(
                          labelText: 'Group Member Limit'),
                      keyboardType: TextInputType.number,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Lock Workspace: '),
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
                      domainsController.text
                          .split(',')
                          .map((s) => s.trim())
                          .toList(),
                      int.parse(limitController.text),
                      groupLock,
                    );
                    if (groupLock) {
                      await removeInviteCode(context);
                    }
                    Navigator.of(context).pop();
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> removeInviteCode(BuildContext context) async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/workspaces/${widget.workspaceId}/removeInvite');

    try {
      final response = await apiInstance.api.delete(
        '/workspaces/${widget.workspaceId}/removeInvite',
        data: jsonEncode({
          'userId': widget.userId,
        }),
      );
      if (response.statusCode == 200) {
        print("Sucessfully Removed Invite Code.");
      }
    } catch (error) {
      print("Error Removing Invite Code: $error");
    }
  }

  Future<void> editWorkspace(String name, List<String> allowedDomains,
      int groupMemberLimit, bool groupLock) async {
    final editUrl = Uri.parse('http://10.0.2.2:5000/workspaces/edit');

    try {
      final response = await apiInstance.api.put(
        '/workspaces/edit',
        data: jsonEncode(<String, dynamic>{
          'userId': widget.userId, // Replace with actual admin user ID
          'workspaceId': widget.workspaceId,
          'name': name,
          'allowedDomains': allowedDomains,
          'groupMemberLimit': groupMemberLimit,
          'groupLock': groupLock,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Workspace updated successfully')),
        );
        fetchWorkspaceName(); // Refresh the workspace name
      } else {
        final errorData = response.data;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error editing workspace: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error editing workspace')),
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
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF004080),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white),
            onPressed: showEditWorkspaceDialog,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Container to list ungrouped students
                Expanded(
                  child: ListView(
                    children: [
                      InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => GetAssignments(
                                token: widget.token,
                                workspaceId: widget.workspaceId,
                                userId: widget.userId,
                              ),
                            ),
                          );
                        },
                        child: const Card(
                          margin: EdgeInsets.all(10),
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "View Assignments",
                                  style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold),
                                ),
                                Icon(Icons.arrow_forward),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Card(
                        margin: const EdgeInsets.all(10),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Ungrouped Students',
                                style: TextStyle(
                                    fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 10),
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
                                      icon: const Icon(Icons.edit),
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
                                      style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete),
                                      onPressed: () {
                                        deleteGroup(group.groupId);
                                      },
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Column(
                                  children: group.members.map((member) {
                                    return InkWell(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => UserProfile(
                                                userId: widget.userId,
                                                token: widget.token,
                                                workspaceId: widget.workspaceId,
                                                targetId: member.userId),
                                          ),
                                        );
                                      },
                                      child: ListTile(
                                        title: Text(
                                            '${member.firstName} ${member.lastName}'),
                                        trailing: IconButton(
                                          icon: const Icon(Icons.edit),
                                          onPressed: () {
                                            showMoveStudentDialog(
                                              Student(
                                                userId: member.userId,
                                                email:
                                                    '', // Assuming email is not available in Member
                                                firstName: member.firstName,
                                                lastName: member.lastName,
                                              ),
                                              currentGroupId: group.groupId,
                                            );
                                          },
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: showAddGroupDialog,
        backgroundColor: const Color.fromARGB(255, 117, 147, 177),
        child: const Icon(Icons.add),
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
  int userId;
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
  int groupId;
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
      members: (json['members'] as List<dynamic>)
          .map((member) => Member.fromJson(member))
          .toList(),
    );
  }
}

class Student {
  int userId;
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
