import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class UserGroup extends StatefulWidget {
  final String workspaceId;
  static const routeName = '/userGroups';

  const UserGroup({required this.workspaceId});

  @override
  State<UserGroup> createState() => _UserGroupState();
}

class _UserGroupState extends State<UserGroup> {
  List<Groups> groups = [];
  String userID = '667a2e4a8f5ce812352bba6f';

  @override
  void initState() {
    super.initState();
    getGroupsData(context, widget.workspaceId);
  }

  Future<void> getGroupsData(BuildContext context, String workspaceId) async {
    final url =
        Uri.parse('http://10.0.2.2:5000/workspaces/$workspaceId/groups');
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          groups = data
              .map((group) => Groups.fromJson(group as Map<String, dynamic>))
              .toList();
        });
      } else {
        throw Exception('Failed to Load Groups');
      }
    } catch (error) {
      print("Error fetching groups: $error");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[200],
      appBar: AppBar(
        backgroundColor: const Color(0xff004080),
        iconTheme: const IconThemeData(
          color: Colors.white,
        ),
        title: const Text(
          'Groups',
          style: TextStyle(
            color: Colors.white,
          ),
        ),
      ),
      body: ListView.separated(
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.all(8.0),
            child: GroupCard(
              group: groups[index],
              groups: groups,
            ),
          );
        },
        separatorBuilder: (context, index) {
          return const Divider(
            height: 10,
            thickness: 0,
          );
        },
        itemCount: groups.length,
      ),
      floatingActionButton: const FloatingActionButton(
        onPressed: null,
        backgroundColor: Colors.green,
        child: Icon(
          Icons.check,
          color: Colors.white,
        ),
      ),
    );
  }
}

class Groups {
  String groupID;
  final String groupName;
  List<dynamic> groupMembers;
  final int numMembers;

  Groups(
      {required this.groupID,
      required this.groupName,
      required this.groupMembers,
      required this.numMembers});

  factory Groups.fromJson(Map<String, dynamic> json) {
    return Groups(
      groupID: json['groupId'] ?? 'No ID',
      groupName: json['name'] ?? 'No name',
      groupMembers: json['members'] ?? [],
      numMembers: json['members'].length,
    );
  }

  void updateGroupID(String newGroupID) {
    groupID = newGroupID;
  }
}

class GroupCard extends StatefulWidget {
  final Groups group;
  final List<Groups> groups;
  const GroupCard({required this.group, required this.groups, super.key});

  @override
  State<GroupCard> createState() => _GroupCardState();
}

class _GroupCardState extends State<GroupCard> {
  late Groups group;
  late List<Groups> groups = widget.groups;
  String userID = '667a2e4a8f5ce812352bba6f';

  @override
  void initState() {
    super.initState();
    group = widget.group;
    groups = widget.groups;
  }

  String getGroupID(String userID) {
    for (Groups group in groups) {
      var groupID = group.groupID;

      for (var member in group.groupMembers) {
        if (member['userId'] == userID) {
          print('Current GroupID: $groupID');
          return groupID;
        } else {
          continue;
        }
      }
    }
    return '';
  }

  Future<dynamic> getUser(String userID) async {
    final url = Uri.parse('http://10.0.2.2:5000/users/$userID');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        var data = json.decode(response.body);
        return data;
      } else {
        print("Error : Invalid Get User Status Code");
      }
    } catch (error) {
      print("Error Getting User: $error");
    }
    return {};
  }

  Future<void> joinGroup(BuildContext context, String groupID) async {
    final url = Uri.parse('http://10.0.2.2:5000/groups/join');
    print('Join Group : $groupID');
    try {
      final response = await http.put(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'groupId': groupID,
          'userId': userID,
        }),
      );
      if (response.statusCode == 200) {
        print("Group Joined Successfully!");
        dynamic userObject = await getUser(userID);

        setState(() {
          for (var group in groups) {
            if (group.groupID == groupID) {
              // Update the groupMembers list
              group.groupMembers.add({
                "userId": userID,
                "firstName": userObject['firstName'],
                "lastName": userObject['lastName'],
              });
            }
          }
        });
      } else {
        final errorData = json.decode(response.body);
        print(
            "Join Group Failed: ${response.statusCode}, ${errorData['message']}");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Join Group Failed: \n${errorData['message']}')),
        );
      }
    } catch (error) {
      print("Error Joining groups: $error");
    }
  }

 Future<void> leaveGroup(BuildContext context) async {
  final url = Uri.parse('http://10.0.2.2:5000/groups/leave');
  String groupID = getGroupID(userID);
  print('GroupID : $groupID');
  if (groupID == '') {
    return;
  }

  try {
    final response = await http.put(
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'groupId': groupID,
        'userId': userID,
      }),
    );
    if (response.statusCode == 200) {
      final responseData = json.decode(response.body);
      print('Leave Group successful: $responseData');
      setState(() {
        Groups? targetGroup;
        for (var group in groups) {
          if (group.groupID == groupID) {
            targetGroup = group;
            break;
          }
        }

        if (targetGroup != null) {
          targetGroup.groupMembers = targetGroup.groupMembers.where((member) {
            return member['userId'] != userID;
          }).toList();
        }
      });
    } else {
      final errorData = json.decode(response.body);
      print(
          "Leave Group Failed: ${response.statusCode}, ${errorData['message']}");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Leave Group Failed: \n${errorData['message']}')),
      );
    }
  } catch (error) {
    print("Error Leaving group: $error");
  }
}


  Widget loadStudentsInGroup(BuildContext context) {
    List<dynamic> members = List<dynamic>.from(widget.group.groupMembers);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: members.map((member) {
        String fullName = member['firstName'] + ' ' + member['lastName'];
        return Text(
          fullName,
          style: const TextStyle(
            fontSize: 17.0,
            color: Color.fromARGB(204, 255, 255, 255),
          ),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xff004080),
        border: Border.all(
          width: 2,
          color: Colors.black,
        ),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.5),
            blurRadius: 4,
            offset: const Offset(0, 8), // changes position of shadow
          ),
        ],
      ),
      padding: const EdgeInsets.all(18.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.group.groupName,
                style: const TextStyle(
                  fontSize: 30.0,
                  color: Color.fromARGB(204, 255, 255, 255),
                ),
              ),
              Text(
                "${widget.group.numMembers}/3",
                style: const TextStyle(
                  fontSize: 17.0,
                  color: Color.fromARGB(204, 255, 255, 255),
                ),
              ),
            ],
          ),
          const SizedBox(
            height: 20,
          ),
          loadStudentsInGroup(context),
          const SizedBox(
            height: 20,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                  onPressed: () async {
                    await leaveGroup(context);
                    await joinGroup(context, widget.group.groupID);
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                  child: const Padding(
                    padding: EdgeInsets.fromLTRB(8.0, 0, 8.0, 0),
                    child: Text("Join",
                        style: TextStyle(
                          color: Colors.white,
                        )),
                  )),
              const SizedBox(
                width: 20,
              ),
              TextButton(
                  onPressed: null,
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: const Padding(
                    padding: EdgeInsets.fromLTRB(8.0, 0, 8.0, 0),
                    child: Text("Leave",
                        style: TextStyle(
                          color: Colors.white,
                        )),
                  )),
            ],
          ),
        ],
      ),
    );
  }
}
