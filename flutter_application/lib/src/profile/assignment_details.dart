import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AssignmentDetails extends StatefulWidget {
  const AssignmentDetails({super.key});

  @override
  State<AssignmentDetails> createState() => _AssignmentDetailsState();
}

class _AssignmentDetailsState extends State<AssignmentDetails> {
  bool isLoading = true;
  final apiInstance = Api();

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
                "Assignment Details",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF004080),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : const Column(
              children: [
                Text("Assignment Info"),
              ],
            ),
    );
  }
}
