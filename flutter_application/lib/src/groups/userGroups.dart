import 'package:flutter/material.dart';

class UserGroup extends StatelessWidget {
  final String workspaceId;
  static const routeName = '/userGroups';

  const UserGroup({required this.workspaceId});

  @override
  Widget build(BuildContext context) {
    var arrNames = [
      'Raman Amin',
      'Ramnaujan Jones',
      'Rajesh Bob',
      'James Johnson',
      'John',
      'Rahim',
      'Ram',
      'Chris',
      'Matthew'
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Groups'),
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
        itemCount: arrNames.length,
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

Widget groupCards(BuildContext context, index) {
  return Container(
    decoration: BoxDecoration(
      color: const Color.fromARGB(255, 37, 113, 175),
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
              "Group #${index + 1}",
              style: const TextStyle(
                fontSize: 20.0,
                color: Color.fromARGB(204, 255, 255, 255),
              ),
            ),
            const Text(
              "1/3",
              style: TextStyle(
                fontSize: 15.0,
                color: Color.fromARGB(204, 255, 255, 255),
              ),
            ),
          ],
        ),
        const SizedBox(
          height: 20,
        ),
        const Column(
          children: [
            Text(
              "Kazi Amin",
              style: TextStyle(
                fontSize: 17.0,
                color: Color.fromARGB(204, 255, 255, 255),
              ),
            ),
            Text(
              "Bob Jones",
              style: TextStyle(
                fontSize: 17.0,
                color: Color.fromARGB(204, 255, 255, 255),
              ),
            ),
            Text(
              "Chris Paul",
              style: TextStyle(
                fontSize: 17.0,
                color: Color.fromARGB(204, 255, 255, 255),
              ),
            ),
          ],
        ),
        const SizedBox(
          height: 20,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton(
                onPressed: null,
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
