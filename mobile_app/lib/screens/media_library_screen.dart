import 'package:flutter/material.dart';
import '../api_service.dart';
import '../models.dart';
import '../components/tappable_scale.dart';
import 'media_preview_screen.dart';

class MediaLibraryScreen extends StatefulWidget {
  const MediaLibraryScreen({super.key});

  @override
  State<MediaLibraryScreen> createState() => _MediaLibraryScreenState();
}

class _MediaLibraryScreenState extends State<MediaLibraryScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;
  final List<Media> _media = [];
  bool _isLoading = false;
  int _currentPage = 1;
  int _totalPages = 1;
  String _selectedType = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _selectedType = _tabController.index == 0 ? 'all' : (_tabController.index == 1 ? 'image' : 'video');
          _media.clear();
          _currentPage = 1;
        });
        _fetchMedia();
      }
    });
    _fetchMedia();
  }

  Future<void> _fetchMedia() async {
    if (_isLoading) return;

    setState(() => _isLoading = true);

    try {
      final response = await _apiService.getMedia(
        page: _currentPage,
        limit: 20,
      );

      if (mounted) {
        setState(() {
          _media.addAll(response.data.where((m) => _selectedType == 'all' || m.fileType == _selectedType));
          _totalPages = response.pagination.totalPages;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Filters', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 20),
            _buildFilterOption('Media Type', ['All', 'Images', 'Videos']),
            const SizedBox(height: 16),
            _buildFilterOption('Category', ['AliShop', 'Fashion', 'Tech']),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.white24)),
                    child: const Text('Reset', style: TextStyle(color: Colors.white70)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.indigoAccent),
                    child: const Text('Apply Filters', style: TextStyle(color: Colors.white)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterOption(String label, List<String> options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, color: Colors.white60)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: options.map((opt) => ChoiceChip(
            label: Text(opt, style: const TextStyle(fontSize: 12)),
            selected: opt == options[0],
            onSelected: (_) {},
            backgroundColor: Colors.white.withOpacity(0.05),
            selectedColor: Colors.indigoAccent.withOpacity(0.3),
            labelStyle: TextStyle(color: opt == options[0] ? Colors.indigoAccent : Colors.white70),
          )).toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 80),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(20)),
                  child: TabBar(
                    controller: _tabController,
                    indicator: BoxDecoration(color: Colors.indigoAccent, borderRadius: BorderRadius.circular(20)),
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white30,
                    dividerColor: Colors.transparent,
                    indicatorSize: TabBarIndicatorSize.tab,
                    tabs: const [Tab(text: 'All'), Tab(text: 'Images'), Tab(text: 'Videos')],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _showFilterSheet,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.tune, color: Colors.white70, size: 20),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification.metrics.pixels == notification.metrics.maxScrollExtent) {
                if (_currentPage < _totalPages && !_isLoading) {
                  _currentPage++;
                  _fetchMedia();
                }
              }
              return false;
            },
            child: RefreshIndicator(
              onRefresh: () async {
                setState(() { _media.clear(); _currentPage = 1; });
                await _fetchMedia();
              },
              child: _media.isEmpty && _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _media.isEmpty && !_isLoading
                    ? const Center(child: Text('No media assets found', style: TextStyle(color: Colors.white54)))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.8,
                        ),
                        itemCount: _media.length + (_isLoading ? 2 : 0),
                        itemBuilder: (context, index) {
                          if (index < _media.length) {
                            final item = _media[index];
                            return _buildMediaCard(item);
                          } else {
                            return const Center(child: CircularProgressIndicator());
                          }
                        },
                      ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMediaCard(Media item) {
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
                      const Center(child: CircleAvatar(backgroundColor: Colors.black45, child: Icon(Icons.play_arrow, color: Colors.white))),
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(4)),
                        child: Text(item.fileType.toUpperCase(), style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(item.fileName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.white70)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
