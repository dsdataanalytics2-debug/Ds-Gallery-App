import 'package:flutter/material.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(top: 80, left: 16, right: 16, bottom: 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Storage Usage', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white70)),
          const SizedBox(height: 16),
          _buildAnalyticsCard('Total Storage', '4.2 GB', Icons.storage_outlined, Colors.indigoAccent),
          const SizedBox(height: 12),
          _buildAnalyticsCard('Asset Growth', '+12.5%', Icons.trending_up, Colors.greenAccent),
          const SizedBox(height: 32),
          const Text('Distribution', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white70)),
          const SizedBox(height: 16),
          _buildDistributionList(),
        ],
      ),
    );
  }

  Widget _buildAnalyticsCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              Text(label, style: const TextStyle(fontSize: 14, color: Colors.white30)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDistributionList() {
    final items = [
      {'label': 'Images', 'value': '65%', 'color': Colors.blueAccent},
      {'label': 'Videos', 'value': '25%', 'color': Colors.purpleAccent},
      {'label': 'Others', 'value': '10%', 'color': Colors.tealAccent},
    ];

    return Column(
      children: items.map((item) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            Container(width: 12, height: 12, decoration: BoxDecoration(color: item['color'] as Color, shape: BoxShape.circle)),
            const SizedBox(width: 12),
            Text(item['label'] as String, style: const TextStyle(color: Colors.white70)),
            const Spacer(),
            Text(item['value'] as String, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
      )).toList(),
    );
  }
}
