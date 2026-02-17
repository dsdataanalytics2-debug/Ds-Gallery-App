import 'package:flutter/material.dart';
import '../api_service.dart';
import '../models.dart';
import '../components/tappable_scale.dart';
import 'media_preview_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  late Future<AnalyticsResponse> _analyticsFuture;

  @override
  void initState() {
    super.initState();
    _analyticsFuture = _apiService.getAnalytics();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AnalyticsResponse>(
      future: _analyticsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
        } else if (!snapshot.hasData) {
          return const Center(child: Text('No data available', style: TextStyle(color: Colors.white)));
        }

        final data = snapshot.data!;
        return RefreshIndicator(
          onRefresh: () async {
            setState(() {
              _analyticsFuture = _apiService.getAnalytics();
            });
          },
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(top: 80, left: 16, right: 16, bottom: 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Overview',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white70),
                ),
                const SizedBox(height: 16),
                _buildStatsGrid(data),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recent Activity',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white70),
                    ),
                    TextButton(
                      onPressed: () {}, // TODO: Navigate to Media
                      child: const Text('View All', style: TextStyle(color: Colors.indigoAccent)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildRecentGrid(data.recentActivity),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatsGrid(AnalyticsResponse data) {
    final summary = data.summary;
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard('Total Assets', summary.totalMedia.toString(), Icons.inventory_2_outlined, Colors.indigoAccent),
        _buildStatCard('Images', summary.imageCount.toString(), Icons.image_outlined, Colors.blueAccent),
        _buildStatCard('Videos', summary.videoCount.toString(), Icons.videocam_outlined, Colors.purpleAccent),
        _buildStatCard('Folders', data.folderDistribution.length.toString(), Icons.folder_copy_outlined, Colors.tealAccent),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 20),
              const Icon(Icons.trending_up, color: Colors.greenAccent, size: 16),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5)),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentGrid(List<Media> recent) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.8,
      ),
      itemCount: recent.length,
      itemBuilder: (context, index) {
        final item = recent[index];
        return TappableScale(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => MediaPreviewScreen(media: item)),
          ),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Hero(
                          tag: item.id,
                          child: Image.network(
                            item.thumbnailUrl ?? item.cdnUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                              Container(color: Colors.white10, child: const Icon(Icons.broken_image, color: Colors.white24)),
                          ),
                        ),
                        if (item.fileType == 'video')
                          const Center(
                            child: CircleAvatar(
                              backgroundColor: Colors.black45,
                              child: Icon(Icons.play_arrow, color: Colors.white),
                            ),
                          ),
                        if (item.fileType == 'video')
                          Positioned(
                            bottom: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                              decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(4)),
                              child: const Text('0:00', style: TextStyle(fontSize: 10, color: Colors.white)),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    item.fileName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
