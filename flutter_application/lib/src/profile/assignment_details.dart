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

        if (questionAverages != null) {
          for (var response in questionAverages) {
            questions.add(response["question"]);
            averageRatingsPerQuestion.add(response["averageRating"]);
          }
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

  Widget ratingsDisplay(int index) {
    return Row(
        children: List.generate(
            averageRatingsPerQuestion[index],
            (index) => const Icon(
                  Icons.star,
                  color: Colors.amber,
                  size: 25,
                )));
  }

  Widget questionRatingDisplay(int index) {
    return Card(
      color: Colors.white,
      child: Container(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  "${index + 1}) ",
                  style: const TextStyle(fontSize: 22),
                ),
                Flexible(
                    child: Text(
                  questions[index],
                  style: const TextStyle(fontSize: 22),
                )),
              ],
            ),
            const SizedBox(
              height: 10,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text(
                      "Average Rating: ",
                      style: TextStyle(fontSize: 18),
                    ),
                    Text(
                      "${averageRatingsPerQuestion[index]}",
                      style: const TextStyle(fontSize: 18),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    ratingsDisplay(index),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget displayAssignments() {
    if (questions.isNotEmpty) {
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
    } else {
      return Expanded(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFF004080), width: 1),
                borderRadius: BorderRadius.circular(12.0),
              ),
              child: const Text(
                "Assignment Not Assigned",
                style: TextStyle(fontSize: 20),
              ),
            ),
          ],
        ),
      );
    }
  }

  Widget detailsBody() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(
            height: 30,
          ),
          const Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Text(
                "Assignment:",
                style: TextStyle(fontSize: 35, color: Colors.white),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(
                height: 20,
              ),
              Flexible(
                  child: Text(
                widget.assignmentName,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 35,
                    fontWeight: FontWeight.w600,
                    overflow: TextOverflow.ellipsis),
              )),
            ],
          ),
          const SizedBox(
            height: 40,
          ),
          Row(
            children: [
              Container(
                  margin: const EdgeInsets.fromLTRB(8.0, 0, 0, 0),
                  child: const Text(
                    "Questions:",
                    style: TextStyle(
                        fontSize: 26,
                        color: Colors.white,
                        fontWeight: FontWeight.w500),
                  )),
            ],
          ),
          const SizedBox(
            height: 10,
          ),
          displayAssignments(),
        ],
      ),
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
                  fontSize: 28,
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
      backgroundColor: const Color(0xFF004080),
    );
  }
}
