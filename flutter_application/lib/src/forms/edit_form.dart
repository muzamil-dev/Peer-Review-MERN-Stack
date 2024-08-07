//TODO: ADD DESIGN AND SETTINGS OPTION

import "package:flutter/material.dart";
import "package:flutter/cupertino.dart";
import 'package:intl/intl.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_application/core.services/api.dart';
import 'dart:convert';
import 'package:flutter_svg/flutter_svg.dart';

class EditForm extends StatefulWidget {
  static const routeName = '/editForm';
  final int userId;
  final int assignmentId;
  final int workspaceId;

  const EditForm(
      {required this.userId,
      required this.assignmentId,
      required this.workspaceId,
      super.key});

  @override
  State<EditForm> createState() => _EditFormState();
}

class _EditFormState extends State<EditForm> {
  int _currentIndex = 0;
  int numFields = 0;
  List<TextEditingController> valueControllers = [];
  List<String> addFormPageErrors = [];
  final _formKey = GlobalKey<FormState>();
  List<int> ratings = [];

  TextEditingController availableFromController = TextEditingController();
  TextEditingController dueUntillController = TextEditingController();
  TextEditingController formName = TextEditingController();
  bool isLoading = true;
  final storage = const FlutterSecureStorage();
  final apiInstance = Api();

  @override
  void initState() {
    super.initState();
    getAssignmentData();
  }

  List<Widget> _widgetTabOptions(BuildContext context) {
    return <Widget>[editFormsPage(context), studentViewPage(context)];
  }

  Future<void> getAssignmentData() async {
    final url = '/assignments/${widget.assignmentId}';

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        print("Succesfully Got Assignment!");
        final jsonResponse = response.data;
        setState(() {
          for (String question in jsonResponse['questions']) {
            valueControllers.add(TextEditingController(text: question));
          }
          // Slices Strings to Not include Extraneous info other than date
          availableFromController.text =
              getDateString(jsonResponse['startDate'].substring(0, 10));
          dueUntillController.text =
              getDateString(jsonResponse['dueDate'].substring(0, 10));

          formName.text = jsonResponse['name'];
          numFields = valueControllers.length;
          isLoading = false;
        });
      }
    } catch (error) {
      print("Error Getting Assignmnet: $error");
    }
  }

  Future<void> editAssignment(BuildContext context) async {
    const url = '/assignments/edit';

    List<String> questions = [];

    for (var controller in valueControllers) {
      questions.add(controller.text);
    }

    try {
      final response = await apiInstance.api.put(
        url,
        data: jsonEncode({
          "userId": widget.userId,
          "workspaceId": widget.workspaceId,
          "assignmentId": widget.assignmentId,
          "name": formName.text,
          "startDate": availableFromController.text,
          "dueDate": dueUntillController.text,
          "questions": questions,
        }),
      );

      if (response.statusCode == 200) {
        print("Succesfully Edited Assignment!");
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Edited Form Successfully!')));
        // Route Back To Admin Page
        Navigator.pop(context);
      } else if (response.statusCode == 400) {
        final jsonResponse = response.data;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(jsonResponse["message"])));
      }
    } catch (error) {
      print("Error Editing Assignment: $error");
    }
  }

  void addFormField() {
    setState(() {
      numFields += 1;
      valueControllers.add(TextEditingController());
    });
  }

  String getDateString(String date) {
    // Parse the input date string
    DateTime dateTime = DateTime.parse(date);

    // Define the desired date format
    DateFormat dateFormat = DateFormat("MM/dd/yy");

    // Format the DateTime object to the desired string format
    String formattedDate = dateFormat.format(dateTime);

    return formattedDate;
  }

  Future<void> _selectDate(TextEditingController controller) async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2024),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      setState(() {
        controller.text = getDateString(picked.toString().split(" ")[0]);
      });
    }
  }

  bool isValidForm(GlobalKey key) {
    if (_formKey.currentState!.validate() == false) {
      print("Validation Failed!");
      return false;
    }

    if (valueControllers.isEmpty) {
      return false;
    }
    return true;
  }

  Widget editFormsPage(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      backgroundColor: const Color(0xff004080),
      body: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Form Name
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Assignment Info",
                              style: TextStyle(
                                  fontSize: 25,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white),
                            ),
                            TextButton(
                              onPressed: () async {
                                if (isValidForm(_formKey) == false) {
                                  ScaffoldMessenger.of(context)
                                      .showSnackBar(const SnackBar(
                                    content: Text(
                                        'Create Form Failed: Form Needs Atleast One Field'),
                                  ));
                                  return;
                                }

                                List<String> questions = [];
                                for (var field in valueControllers) {
                                  questions.add(field.text);
                                }
                                await editAssignment(context);
                                setState(() {
                                  _formKey.currentState!.reset();
                                  valueControllers = [];
                                  numFields = 0;
                                });
                              },
                              style: TextButton.styleFrom(
                                backgroundColor: Colors.green,
                              ),
                              child: const Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Text(
                                    "Edit Form",
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 15),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: formName,
                          decoration: InputDecoration(
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(18.0)),
                              hintText: "Assignment Name",
                              filled: true,
                              fillColor: Colors.white,
                              focusedBorder: OutlineInputBorder(
                                borderSide: const BorderSide(
                                    color: Colors.blue, width: 3),
                                borderRadius: BorderRadius.circular(18.0),
                              ),
                              errorStyle: const TextStyle(
                                  color: Colors.red,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold)),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Please Enter a Non-Empty Field";
                            }
                            return null;
                          },
                        ),
                        const SizedBox(
                          height: 15,
                        ),
                        TextFormField(
                          controller: availableFromController,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Please Enter a Non-Empty Field";
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(18.0)),
                              hintText: 'Available From',
                              filled: true,
                              fillColor: Colors.white,
                              prefixIcon: const Icon(Icons.calendar_today),
                              focusedBorder: OutlineInputBorder(
                                  borderSide: const BorderSide(
                                      color: Colors.blue, width: 3),
                                  borderRadius: BorderRadius.circular(18.0)),
                              errorStyle: const TextStyle(
                                  color: Colors.red,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold)),
                          readOnly: true,
                          onTap: () {
                            _selectDate(availableFromController);
                          },
                        ),
                        const SizedBox(
                          height: 15,
                        ),
                        TextFormField(
                          controller: dueUntillController,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Please Enter a Non-Empty Field";
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(18.0)),
                              hintText: 'Available Untill',
                              filled: true,
                              fillColor: Colors.white,
                              prefixIcon:
                                  const Icon(Icons.calendar_month_outlined),
                              focusedBorder: OutlineInputBorder(
                                  borderSide: const BorderSide(
                                      color: Colors.blue, width: 3),
                                  borderRadius: BorderRadius.circular(18.0)),
                              errorStyle: const TextStyle(
                                  color: Colors.red,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold)),
                          readOnly: true,
                          onTap: () {
                            _selectDate(dueUntillController);
                          },
                        ),
                        const SizedBox(
                          height: 15,
                        ),
                        // Form Settings

                        // Form Fields (Li
                        // Builder)
                        Container(
                          padding: const EdgeInsets.all(2.0),
                          decoration: const BoxDecoration(
                              border: BorderDirectional(
                                  bottom: BorderSide(
                                      color: Colors.white, width: 2))),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Fields',
                                style: TextStyle(
                                    fontSize: 25,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white),
                              ),
                              IconButton(
                                onPressed: addFormField,
                                icon: const Icon(
                                  Icons.add,
                                  color: Colors.white,
                                ),
                                style: IconButton.styleFrom(
                                    backgroundColor: Colors.green),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        formFields(context),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget formFields(BuildContext context) {
    if (numFields == 0) {
      return displayEmptyWidget(context);
    } else {
      return SizedBox(
        height: 400,
        child: RawScrollbar(
          thumbColor: Colors.black,
          child: ListView.separated(
            itemBuilder: (context, index) {
              return formChild(context, index);
            },
            separatorBuilder: (BuildContext context, index) => const Divider(
              height: 15,
              thickness: 0,
            ),
            itemCount: numFields,
          ),
        ),
      );
    }
  }

  Widget formChild(BuildContext context, index) {
    return Container(
        decoration: BoxDecoration(
          color: const Color.fromARGB(255, 255, 255, 255),
          border: Border.all(
            width: 3,
            color: const Color(0xff004080),
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.fromLTRB(7.0, 0, 0, 0),
              child: Text(
                "Question ${index + 1}",
                style:
                    const TextStyle(fontSize: 25, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 10),
            TextFormField(
                controller: valueControllers[index],
                decoration: InputDecoration(
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18.0)),
                    hintText: 'Value',
                    filled: true,
                    fillColor: Colors.white,
                    focusedBorder: OutlineInputBorder(
                        borderSide:
                            const BorderSide(color: Colors.black, width: 2),
                        borderRadius: BorderRadius.circular(18.0)))),
            const SizedBox(
              height: 10,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                    onPressed: () {
                      setState(() {
                        numFields -= 1;
                        valueControllers.removeAt(index);
                      });
                    },
                    icon: const Icon(
                      CupertinoIcons.delete,
                      color: Colors.white,
                    ),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.red,
                    )),
              ],
            ),
          ],
        ));
  }

  Widget invalidFormPage(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            "Fix these in the Edit Form Page:",
            style: TextStyle(fontSize: 26.0, fontWeight: FontWeight.bold),
          ),
          const SizedBox(
            height: 15.0,
          ),
          SizedBox(
            height: 150,
            child: ListView.builder(
              itemCount: addFormPageErrors.length,
              itemBuilder: (context, index) {
                return Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        const SizedBox(width: 40),
                        // Bullet Point Container
                        Container(
                          decoration: const BoxDecoration(
                            color: Colors.black,
                            shape: BoxShape.circle,
                          ),
                          width: 7,
                          height: 7,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          addFormPageErrors[index],
                          style: const TextStyle(fontSize: 18),
                        ),
                      ],
                    ),
                    const SizedBox(
                      height: 10.0,
                    )
                  ],
                );
              },
            ),
          )
        ],
      ),
    );
  }

  Widget studentViewPage(BuildContext context) {
    if (invalidFormFields()) {
      return invalidFormPage(context);
    } else {
      // Initializes Ratings Array For Number of Total Forms that Exists
      for (int i = 0; i < valueControllers.length; i++) {
        ratings.add(3); // Initalized to 3 because Stars start at 3
      }
      return Container(
        color: const Color(0xff004080),
        padding: const EdgeInsets.all(10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title of Assignment
            Container(
              margin: const EdgeInsets.fromLTRB(3.0, 0, 0, 0),
              child: Text(
                formName.text,
                style: const TextStyle(
                    fontSize: 35.0,
                    fontWeight: FontWeight.bold,
                    color: Colors.white),
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xff004080), width: 1),
                borderRadius: BorderRadius.circular(12),
                color: Colors.white,
              ),
              padding: const EdgeInsets.all(10.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  const Text(
                    "Due: ",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    dueUntillController.text,
                    style: const TextStyle(
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(
                    width: 15,
                  ),
                  const Text(
                    "Questions: ",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "${valueControllers.length}",
                    style: const TextStyle(
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(
                    width: 15,
                  ),
                  const Text(
                    "Status: ",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const CircleAvatar(
                    radius: 15,
                    backgroundColor: Colors.red,
                    child: IconButton(
                      onPressed: null,
                      icon: Icon(
                        Icons.close_outlined,
                        color: Colors.white,
                        size: 15,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Expanded(
                child: RawScrollbar(
              thumbColor: Colors.black,
              child: ListView.separated(
                  itemBuilder: (context, index) {
                    return Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                            color: const Color(0xff004080), width: 1),
                        borderRadius: BorderRadius.circular(8.0),
                        color: Colors.white,
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "Question ${index + 1}:",
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 27,
                                ),
                              ),
                              Text(
                                "Rating: ${ratings[index]} / 5",
                                style: const TextStyle(fontSize: 20),
                              ),
                            ],
                          ),
                          const SizedBox(
                            height: 7,
                          ),
                          Text(
                            valueControllers[index].text,
                            style: const TextStyle(fontSize: 22),
                          ),
                          const SizedBox(
                            height: 15,
                          ),
                          RatingBar.builder(
                            initialRating: 3,
                            minRating: 0,
                            direction: Axis.horizontal,
                            allowHalfRating: false,
                            itemCount: 5,
                            itemPadding:
                                const EdgeInsets.symmetric(horizontal: 4.0),
                            itemBuilder: (context, _) => const Icon(
                              Icons.star,
                              color: Colors.amber,
                            ),
                            onRatingUpdate: (rating) {
                              setState(() {
                                ratings[index] = rating.toInt();
                              });
                            },
                          ),
                        ],
                      ),
                    );
                  },
                  separatorBuilder: (context, index) {
                    return const Divider(
                      height: 10,
                      thickness: 0,
                    );
                  },
                  itemCount: valueControllers.length),
            )),
          ],
        ),
      );
    }
  }

  bool invalidFormFields() {
    // Outer Condition Prevents too many Additons of addFormPageErrors while changing tabs between Edit Form and Student View
    if (_currentIndex == 1) {
      if (formName.text == '') {
        addFormPageErrors.add("Empty Form Name: Enter a Name");
      }
      if (availableFromController.text == '') {
        addFormPageErrors.add("Empty Start Date: Enter a Start Date");
      }
      if (dueUntillController.text == '') {
        addFormPageErrors.add("Empty Due Date: Enter a Due Date");
      }

      if (valueControllers.isEmpty) {
        addFormPageErrors.add("Empty Fields: Add Atleast One Field");
      }
    }

    return addFormPageErrors.isNotEmpty;
  }

  Widget displayEmptyWidget(BuildContext context) {
    return Column(
      children: [
        const SizedBox(
          height: 60,
        ),
        TextButton(
          onPressed: () {},
          style: TextButton.styleFrom(
            backgroundColor: Colors.white,
          ),
          child: const Padding(
            padding: EdgeInsets.all(10.0),
            child: Center(
              child: Text(
                "Press The + Button to Create Fields",
                style: TextStyle(color: Colors.black, fontSize: 18),
              ),
            ),
          ),
        ),
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
                  "Edit Assignment",
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          iconTheme: const IconThemeData(color: Colors.white),
          backgroundColor: const Color(0xff004080),
        ),
        body: isLoading
            ? const Center(
                child: CircularProgressIndicator(),
              )
            : _widgetTabOptions(context).elementAt(_currentIndex),
        bottomNavigationBar: BottomNavigationBar(
          backgroundColor: Colors.white,
          elevation: 8.0,
          fixedColor: const Color(0xff004080),
          selectedIconTheme: const IconThemeData(
            color: Color(0xff004080),
          ),
          unselectedItemColor: Colors.black87,
          currentIndex: _currentIndex,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
                icon: Icon(
                  Icons.calendar_today_rounded,
                ),
                label: 'Add Assignment'),
            BottomNavigationBarItem(
              icon: Icon(CupertinoIcons.eyeglasses),
              label: 'Student View',
            ),
          ],
          onTap: (index) {
            setState(() {
              _currentIndex = index;

              if (_currentIndex == 0) {
                addFormPageErrors = [];
              }
            });
          },
        ));
  }
}
