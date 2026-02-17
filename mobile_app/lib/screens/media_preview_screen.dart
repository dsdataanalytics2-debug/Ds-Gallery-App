import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../models.dart';
import '../api_service.dart';
import '../components/tappable_scale.dart';
import '../components/thumbnail_selection_sheet.dart';
import '../components/video_player_widget.dart';

class MediaPreviewScreen extends StatefulWidget {
  final Media media;
  const MediaPreviewScreen({super.key, required this.media});

  @override
  State<MediaPreviewScreen> createState() => _MediaPreviewScreenState();
}

class _MediaPreviewScreenState extends State<MediaPreviewScreen> {
  final ApiService _apiService = ApiService();
  bool _isDeleting = false;
  bool _isDownloading = false;
  double _downloadProgress = 0;
  late String _currentFileName;
  // late String _currentThumbnailUrl; // Removed unused variable

  @override
  void initState() {
    super.initState();
    _currentFileName = widget.media.fileName;
    // _currentThumbnailUrl = widget.media.thumbnailUrl ?? widget.media.cdnUrl;
  }

  Future<void> _handleDelete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Delete Media?', style: TextStyle(color: Colors.white)),
        content: const Text('This action cannot be undone.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isDeleting = true);
      try {
        await _apiService.deleteMedia(widget.media.id);
        if (mounted) {
          Navigator.pop(context); // Close preview
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Media deleted successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isDeleting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting media: $e')),
          );
        }
      }
    }
  }

  Future<void> _handleRename() async {
    final controller = TextEditingController(text: _currentFileName);
    final newName = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Rename Media', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Enter new name',
            hintStyle: TextStyle(color: Colors.white24),
            enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
            focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.indigoAccent)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigoAccent),
            child: const Text('Rename', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (newName != null && newName.isNotEmpty && newName != _currentFileName) {
      try {
        await _apiService.updateMedia(widget.media.id, {'fileName': newName});
        setState(() => _currentFileName = newName);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Media renamed successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error renaming media: $e')),
          );
        }
      }
    }
  }

  Future<void> _handleDownload() async {
    // Request permission (needed mainly for Android < 11 or specific public folders)
    if (Platform.isAndroid) {
      final status = await Permission.storage.request();
      if (status.isDenied) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Storage permission denied')),
          );
        }
        return;
      }
    }

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0;
    });

    try {
      final dio = Dio();
      Directory? directory;
      
      if (Platform.isAndroid) {
        // Download to public Downloads folder if possible, otherwise app documents
        directory = Directory('/storage/emulated/0/Download');
        if (!await directory.exists()) {
          directory = await getExternalStorageDirectory();
        }
      } else {
        directory = await getApplicationDocumentsDirectory();
      }

      final String savePath = '${directory!.path}/${_currentFileName}';
      
      await dio.download(
        widget.media.cdnUrl,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              _downloadProgress = received / total;
            });
          }
        },
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Downloaded to: $savePath')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  void _handleChangeThumbnail() async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ThumbnailSelectionSheet(media: widget.media),
    );

    if (result == true) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thumbnail updated. Please refresh to see changes.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.info_outline, color: Colors.white), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert, color: Colors.white), onPressed: () {}),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: Center(
                  child: Hero(
                    tag: widget.media.id,
                    child: widget.media.fileType == 'video'
                        ? VideoPlayerWidget(url: widget.media.cdnUrl)
                        : Image.network(
                            widget.media.cdnUrl,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) =>
                              const Icon(Icons.broken_image, size: 100, color: Colors.white24),
                          ),
                  ),
                ),
              ),
              if (_isDownloading)
                LinearProgressIndicator(
                  value: _downloadProgress,
                  backgroundColor: Colors.white10,
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.indigoAccent),
                ),
              _buildMetadataSection(),
              _buildActionToolbar(),
            ],
          ),
          if (_isDeleting)
            Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Widget _buildMetadataSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _currentFileName,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildInfoBadge(widget.media.fileFormat.toUpperCase()),
              const SizedBox(width: 8),
              _buildInfoBadge('${(widget.media.fileSize / (1024 * 1024)).toStringAsFixed(2)} MB'),
              if (widget.media.fileType == 'video') ...[
                const SizedBox(width: 8),
                _buildInfoBadge('Video'),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: const TextStyle(fontSize: 10, color: Colors.white60)),
    );
  }

  Widget _buildActionToolbar() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      color: const Color(0xFF1E293B),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildActionButton(Icons.download_outlined, 'Download', 
                onTap: _isDownloading ? () {} : _handleDownload),
            const SizedBox(width: 20),
            _buildActionButton(Icons.drive_file_move_outlined, 'Move', onTap: () {}),
            const SizedBox(width: 20),
            _buildActionButton(Icons.edit_outlined, 'Rename', onTap: _handleRename),
            const SizedBox(width: 20),
            if (widget.media.fileType == 'video') ...[
              _buildActionButton(Icons.image_outlined, 'Thumbnail', onTap: _handleChangeThumbnail),
              const SizedBox(width: 20),
            ],
            _buildActionButton(Icons.delete_outline, 'Delete', color: Colors.redAccent, onTap: _handleDelete),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, {Color color = Colors.white70, required VoidCallback onTap}) {
    return TappableScale(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 10, color: color)),
          ],
        ),
      ),
    );
  }
}
