import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../api_service.dart';
import '../models.dart';
import 'tappable_scale.dart';

class ThumbnailSelectionSheet extends StatefulWidget {
  final Media media;
  const ThumbnailSelectionSheet({super.key, required this.media});

  @override
  State<ThumbnailSelectionSheet> createState() => _ThumbnailSelectionSheetState();
}

class _ThumbnailSelectionSheetState extends State<ThumbnailSelectionSheet> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  bool _isUploading = false;

  Future<void> _pickAndUpload() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _isUploading = true);
      try {
        await _apiService.uploadThumbnail(widget.media.id, File(image.path));
        if (mounted) {
          Navigator.pop(context, true); // Success
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Thumbnail updated successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isUploading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error uploading thumbnail: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 20),
            width: 40,
            height: 4,
            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
          ),
          const Text(
            'Change Thumbnail',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 24),
          if (_isUploading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: CircularProgressIndicator(color: Colors.indigoAccent),
            )
          else ...[
            _buildOption(
              icon: Icons.image_outlined,
              title: 'Upload Custom Thumbnail',
              subtitle: 'Pick an image from your gallery',
              onTap: _pickAndUpload,
            ),
            const SizedBox(height: 12),
            _buildOption(
              icon: Icons.video_camera_back_outlined,
              title: 'Generate from Video',
              subtitle: 'Coming soon',
              onTap: () {},
              enabled: false,
            ),
            const SizedBox(height: 20),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool enabled = true,
  }) {
    return TappableScale(
      onTap: enabled ? onTap : () {},
      child: Opacity(
        opacity: enabled ? 1.0 : 0.5,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.indigoAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.indigoAccent, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.white60)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.white24),
            ],
          ),
        ),
      ),
    );
  }
}
