import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class LineChartWidget extends StatefulWidget {
  final List<String> assignmentNames;
  final List<double> assignmentRatings;

  const LineChartWidget(
      {required this.assignmentNames,
      required this.assignmentRatings,
      super.key});

  @override
  State<LineChartWidget> createState() => _LineChartWidgetState();
}

class _LineChartWidgetState extends State<LineChartWidget> {
  final Gradient gradiantColors = const LinearGradient(colors: [
    Colors.redAccent,
    Colors.orangeAccent,
  ]);

  List<String> filteredNames = [];
  List<double> filteredRatings = [];

  @override
  void initState() {
    super.initState();
    filterData(widget.assignmentNames, widget.assignmentRatings);
  }

  void filterData(
      List<String> assignmentNames, List<double> assignmentRatings) {
    for (final (int, double) rating in assignmentRatings.indexed) {
      setState(() {
        if (rating.$2 != -1) {
          filteredNames.add(assignmentNames[rating.$1]);
          filteredRatings.add(rating.$2);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return LineChart(
      LineChartData(
        minX: 0,
        maxX: (filteredNames.length - 1).toDouble(),
        minY: 0,
        maxY: 5,
        titlesData: Titles.getTitleData(),
        gridData: FlGridData(
          show: true,
          getDrawingHorizontalLine: (value) {
            return FlLine(color: Colors.grey[800], strokeWidth: 1);
          },
        ),
        borderData: FlBorderData(
            show: true, border: Border.all(color: Colors.white70, width: 2)),
        lineBarsData: [
          LineChartBarData(
            spots: filteredRatings.indexed.map(((int, double) item) {
              final (index, rating) = item;
              return FlSpot(index.toDouble(), rating);
            }).toList(),
            isCurved: true,
            gradient: gradiantColors,
            barWidth: 3,
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(colors: [
                Colors.redAccent.withOpacity(.4),
                Colors.orangeAccent.withOpacity(.4),
              ]),
            ),
          )
        ],
        lineTouchData: LineTouchData(
          getTouchedSpotIndicator: (barData, spotIndexes) {
            return spotIndexes.map((index) {
              return const TouchedSpotIndicatorData(
                FlLine(color: Colors.green, strokeWidth: 4),
                FlDotData(show: true),
              );
            }).toList();
          },
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((touchedSpot) {
                return LineTooltipItem(
                  '${touchedSpot.y}',
                  const TextStyle(
                    color: Colors.white,
                  ),
                );
              }).toList();
            },
            tooltipPadding: const EdgeInsets.all(8),
            tooltipMargin: 8,
            fitInsideVertically: true,
            fitInsideHorizontally: true,
            tooltipHorizontalAlignment: FLHorizontalAlignment.right,
          ),
        ),
      ),
    );
  }
}

class Titles {
  static getTitleData() => FlTitlesData(
        show: true,
        bottomTitles: const AxisTitles(
          axisNameWidget: Text(
            "Assignments Over Time",
            style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          axisNameSize: 35,
        ),
        leftTitles: AxisTitles(
            axisNameWidget: const Text(
              "Ratings",
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
            axisNameSize: 35,
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                if (value == value.roundToDouble()) {
                  return Text(
                    "$value",
                    style: const TextStyle(color: Colors.white),
                  );
                }
                return const Text("");
              },
              reservedSize: 35,
            )),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles:
            const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      );
}
