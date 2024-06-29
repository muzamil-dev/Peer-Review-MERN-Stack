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
  List<dynamic> groups = [];
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
        final jsonResponse = json.decode(response.body);
        setState(() {
          groups = jsonResponse.toList();
        });
      }
    } catch (error) {
      print("Error fetching groups: $error");
    }
  }

  Future<void> joinGroup(BuildContext context, String groupID) async {
    final url = Uri.parse('http://10.0.2.2:5000/groups/join');
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
        setState(() {
          getGroupsData(context, widget.workspaceId);
        });
      } else {
        final errorData = json.decode(response.body);
        print(
            "JoinGroup Failed: ${response.statusCode}, ${errorData['message']}");
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
      print("Error Joining groups: $error");
    }
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

  bool checkGroup(List<dynamic> currenGroupList) {
    for (var member in currenGroupList) {
      if (member['userId'] == userID) {
        return true;
      }
    }
    return false;
  }

  // Parses through groups list and returns the group which the user is currently in
  // If the user is not in a group , returns ''
  String getGroupID(String userID) {
    for (var group in groups) {
      var groupID = group['groupId'];

      for (var member in group['members']) {
        if (member['userId'] == userID) {
          return groupID;
        } else {
          continue;
        }
      }
    }
    return '';
  }

  Widget loadStudentsInGroup(BuildContext context, index) {
    var currentGroup = groups[index];
    List<dynamic> members = List<dynamic>.from(currentGroup['members']);

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

  Widget displayButtons(BuildContext context, index, groupID) {
    var currentGroup = groups[index];
    var userInCurrenGroup = checkGroup(currentGroup['members']);

    if (!userInCurrenGroup) {
      return TextButton(
          onPressed: () async {
            await leaveGroup(context);
            await joinGroup(context, groupID);
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
          ));
    }
    return TextButton(
        onPressed: () async {
          await leaveGroup(context);
        },
        style: TextButton.styleFrom(
          backgroundColor: Colors.red,
        ),
        child: const Padding(
          padding: EdgeInsets.fromLTRB(8.0, 0, 8.0, 0),
          child: Text("Leave",
              style: TextStyle(
                color: Colors.white,
              )),
        ));
  }

  Widget groupCards(BuildContext context, index) {
    var currentGroup = groups[index];
    var numMembers = currentGroup['members'].length.toString();
    var groupID = currentGroup['groupId'];
    var groupName = currentGroup['name'];

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
                groupName,
                style: const TextStyle(
                  fontSize: 30.0,
                  color: Color.fromARGB(204, 255, 255, 255),
                ),
              ),
              Text(
                "$numMembers/3",
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
          loadStudentsInGroup(context, index),
          const SizedBox(
            height: 20,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              displayButtons(context, index, groupID),
            ],
          ),
        ],
      ),
    );
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
            child: groupCards(context, index),
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
