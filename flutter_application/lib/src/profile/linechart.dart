import 'package:collection/collection.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class LineChartWidget extends StatelessWidget {
  const LineChartWidget({super.key});

  final Gradient gradiantColors = const LinearGradient(colors: [
    Colors.redAccent,
    Colors.orangeAccent,
  ]);

  @override
  Widget build(BuildContext context) {
    return LineChart(
      LineChartData(
        minX: 0,
        maxX: 11,
        minY: 0,
        maxY: 70000,
        titlesData: Titles.getTitleData(),
        gridData: FlGridData(
          show: true,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.grey[800],
              strokeWidth: 1
            );
          },
        ),
        borderData: FlBorderData(
          show: true,
          border: Border.all(color: Colors.grey, width: 2)
        ),
        lineBarsData: [
          LineChartBarData(
            spots: const[
              FlSpot(0, 30000),
              FlSpot(2, 10000),
              FlSpot(4, 50000),
              FlSpot(6, 43000),
              FlSpot(8, 40000),
              FlSpot(9, 30000),
              FlSpot(11, 38000),
            ],
            isCurved: true,
            gradient: gradiantColors,
            barWidth: 3,
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(colors: [
                Colors.redAccent.withOpacity(.4),
                Colors.orangeAccent.withOpacity(.4),
              ]),
            )

          )
        ]
      )
    );
  }
}

class Titles {
  static getTitleData() => FlTitlesData(
        show: true,
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 35,
            getTitlesWidget: (value, meta) {
              switch (value.toInt()) {
                case 2:
                  return const Text('2020');
                case 5:
                  return const Text('2021');
                case 8:
                  return const Text('2022');
              }
              return const Text('');
            },
          ),
        ),
      leftTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          getTitlesWidget: (value, meta) {
            switch(value.toInt()) {
              case 10000:
                return const Text('10K');
              case 20000:
                return const Text('20K');
              case 30000:
                return const Text('30K');
              case 40000:
                return const Text('40K');
              case 50000:
                return const Text('50K');
              case 60000:
                return const Text('60K');
              case 70000:
                return const Text('70K');
            }
            return const Text("");
          },
          reservedSize: 35,

        )
      )
      );
}
