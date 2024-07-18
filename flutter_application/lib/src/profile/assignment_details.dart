import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AssignmentDetails extends StatefulWidget {
  final String assignmentName;
  final int assignmentId;
  final int targetUserId;
  const AssignmentDetails(
      {required this.assignmentName,
      required this.assignmentId,
      required this.targetUserId,
      super.key});

  @override
  State<AssignmentDetails> createState() => _AssignmentDetailsState();
}

class _AssignmentDetailsState extends State<AssignmentDetails> {
  List<String> questions = [];
  List<int> averageRatingsPerQuestion = [];
  bool isLoading = true;
  final apiInstance = Api();

  @override
  void initState() {
    super.initState();
    getAssignmentDetails(context);
  }

  // Gets Current Assignment Questions and Question Averages
  Future<void> getAssignmentDetails(BuildContext context) async {
    final url =
        '/assignments/averages/${widget.assignmentId}/target/${widget.targetUserId}';

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = response.data;
        final questionAverages = jsonResponse["questionAverages"];
        for (var response in questionAverages) {
          questions.add(response["question"]);
          averageRatingsPerQuestion.add(response["averageRating"]);
        }
        setState(() {
          isLoading = false;
        });

        print(questions);
        print(averageRatingsPerQuestion);
      }
    } catch (error) {
      print("Error Getting Assignment Details: $error");
    }
  }

  Widget questionRatingDisplay(int index) {
    return Card(
      child: Column(
        children: [
          Text("Question ${index + 1}: "),
          Text(questions[index]),
          Row(
            children: [
              const Text("Rating Recieved: "),
              Text("${averageRatingsPerQuestion[index]}"),
            ],
          )
        ],
      ),
    );
  }

  Widget displayAssignments() {
    return Expanded(
      child: RawScrollbar(
        child: ListView.separated(
            itemBuilder: (context, index) {
              return questionRatingDisplay(index);
            },
            separatorBuilder: (context, index) {
              return const Divider(
                height: 10,
                thickness: 0,
              );
            },
            itemCount: questions.length),
      ),
    );
  }

  Widget detailsBody() {
    return Column(
      children: [
        Flexible(
            child: Text(
          "Assignment: ${widget.assignmentName}",
          style: const TextStyle(overflow: TextOverflow.ellipsis),
        )),
        const Text("Questions:"),
        displayAssignments(),
      ],
    );
  }

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
          : detailsBody(),
    );
  }
}
