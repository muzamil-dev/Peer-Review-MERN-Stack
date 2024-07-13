import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class UserGroup extends StatefulWidget {
  final int workspaceId;
  static const routeName = '/userGroups';
  final int userId;

  const UserGroup({required this.workspaceId, required this.userId, super.key});

  @override
  State<UserGroup> createState() => _UserGroupState();
}

class _UserGroupState extends State<UserGroup> {
  List<dynamic> groups = [];
  int maxGroupLimit = -1;
  bool isWorkspaceLocked = false;
  final apiInstance = Api();
  final storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    getGroupsData(context);
  }

  Future<void> getLockedStatus(BuildContext context) async {
    final url = '/workspaces/${widget.workspaceId}';

    try {
      final response = await apiInstance.api.get(url);
      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        setState(() {
          isWorkspaceLocked = jsonResponse['groupLock'];
        });
      }
    } catch (error) {
      print("Error Getting Locked Status: $error");
    }
  }

  Future<void> getGroupsData(BuildContext context) async {
    final url = '/workspaces/${widget.workspaceId}/groups';

    try {
      final response = await apiInstance.api.get(url);
      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        await getLockedStatus(context);
        setState(() {
          groups = jsonResponse['groups'].toList();
          maxGroupLimit = jsonResponse['groupMemberLimit'];
        });
      }
    } catch (error) {
      print("Error fetching groups: $error");
    }
  }

  Future<void> joinGroup(BuildContext context, int groupID, index) async {
    const String url = '/groups/join';

    try {
      final response = await apiInstance.api.put(
        url,
        data: jsonEncode({
          'groupId': groupID,
          'userId': widget.userId,
        }),
      );
      if (response.statusCode == 200) {
        setState(() {
          getGroupsData(context);
        });
      } else {
        final errorData = response.data;
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
    const url = '/groups/leave';

    int groupID = getGroupID();

    if (groupID == -1) {
      return;
    }

    try {
      final response = await apiInstance.api.put(
        url,
        data: jsonEncode({
          'groupId': groupID,
          'userId': widget.userId,
        }),
      );
      if (response.statusCode == 200) {
        // print('Leave Group successful: $responseData');
        setState(() {
          getGroupsData(context);
        });
      } else {
        final errorData = response.data;
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

  bool checkGroup(List<dynamic> currenGroupList) {
    for (var member in currenGroupList) {
      if (member['userId'] == widget.userId) {
        return true;
      }
    }
    return false;
  }

  // Parses through groups list and returns the group which the user is currently in
  // If the user is not in a group , returns ''
  int getGroupID() {
    for (var group in groups) {
      var groupID = group['groupId'];

      for (var member in group['members']) {
        if (member['userId'] == widget.userId) {
          return groupID;
        } else {
          continue;
        }
      }
    }
    return -1;
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

  Widget displayGroupButtons(BuildContext context, index, groupID) {
    var currentGroup = groups[index];
    var userInCurrenGroup = checkGroup(currentGroup['members']);
    var numMembers = currentGroup['members'].length;

    if (isWorkspaceLocked ||
        (maxGroupLimit == numMembers && !userInCurrenGroup)) {
      return const SizedBox();
    }

    if (!userInCurrenGroup) {
      return TextButton(
          onPressed: () async {
            await leaveGroup(context);
            await joinGroup(context, groupID, index);
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

  Widget lockWidget(BuildContext context) {
    if (isWorkspaceLocked) {
      return TextButton(
          onPressed: null,
          style: TextButton.styleFrom(
            backgroundColor: Colors.redAccent,
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Text(
                'Workspace: Locked',
                style: TextStyle(
                  color: Colors.white,
                ),
              ),
              SizedBox(
                width: 10,
              ),
              Icon(
                Icons.lock,
                color: Colors.white,
              ),
            ],
          ));
    }
    return TextButton(
        onPressed: null,
        style: TextButton.styleFrom(
          backgroundColor: Colors.green,
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Text(
              'Workspace: Unlocked',
              style: TextStyle(
                color: Colors.white,
              ),
            ),
            SizedBox(
              width: 10,
            ),
            Icon(
              Icons.lock_open,
              color: Colors.white,
            ),
          ],
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
                "$numMembers/$maxGroupLimit",
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
              displayGroupButtons(context, index, groupID),
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
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Groups',
              style: TextStyle(
                color: Colors.white,
              ),
            ),
            lockWidget(context),
          ],
        ),
      ),
      body: RawScrollbar(
        child: ListView.separated(
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
      ),
    );
  }
}
