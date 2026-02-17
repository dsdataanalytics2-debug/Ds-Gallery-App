import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models.dart';
import 'components/tappable_scale.dart';
import 'screens/media_preview_screen.dart';

class MediaGridScreen extends StatefulWidget {
  final Folder folder;
  const MediaGridScreen({super.key, required this.folder});

  @override
  State<MediaGridScreen> createState() => _MediaGridScreenState();
}

class _MediaGridScreenState extends State<MediaGridScreen> {
  final ApiService _apiService = ApiService();
  final List<Media> _media = [];
  bool _isLoading = false;
  int _currentPage = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _fetchMedia();
  }

  Future<void> _fetchMedia() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiService.getMedia(
        folderId: widget.folder.id,
        page: _currentPage,
        limit: 20,
      );

      if (mounted) {
        setState(() {
          _media.addAll(response.data);
          _totalPages = response.pagination.totalPages;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading media: $e')),
        );
      }
    }
  }

  void _loadMore() {
    if (_currentPage < _totalPages && !_isLoading) {
      _currentPage++;
      _fetchMedia();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text(widget.folder.name),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
      ),
      body: NotificationListener<ScrollNotification>(
        onNotification: (ScrollNotification scrollInfo) {
          if (scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent) {
            _loadMore();
          }
          return false;
        },
        child: _media.isEmpty && _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _media.isEmpty && !_isLoading
                ? const Center(
                    child: Text(
                      'No media found in this collection',
                      style: TextStyle(color: Colors.blueGrey),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: _media.length + (_isLoading ? 2 : 0),
                    itemBuilder: (context, index) {
                      if (index < _media.length) {
                        final item = _media[index];
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
                                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else {
                        return const Center(child: CircularProgressIndicator());
                      }
                    },
                  ),
      ),
    );
  }
}
