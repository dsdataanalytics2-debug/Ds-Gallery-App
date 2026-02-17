import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../api_service.dart';
import '../models.dart';
import '../components/tappable_scale.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  
  List<File> _selectedFiles = [];
  Folder? _selectedFolder;
  bool _isUploading = false;
  Map<int, double> _uploadProgress = {};
  Map<int, String> _uploadStatus = {};

  Future<void> _pickFiles() async {
    final List<XFile> pickedFiles = await _picker.pickMultiImage();
    if (pickedFiles.isNotEmpty) {
      setState(() {
        _selectedFiles.addAll(pickedFiles.map((x) => File(x.path)));
      });
    }
  }

  Future<void> _pickVideo() async {
    final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
    if (video != null) {
      setState(() {
        _selectedFiles.add(File(video.path));
      });
    }
  }

  Future<void> _selectFolder() async {
    setState(() => _isUploading = true); // Using as a temporary loading state
    try {
      final foldersRes = await _apiService.getFolders(limit: 100);
      if (!mounted) return;
      setState(() => _isUploading = false);

      final Folder? selected = await showDialog<Folder>(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('Select Destination', style: TextStyle(color: Colors.white)),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: foldersRes.data.length,
              itemBuilder: (context, index) {
                final folder = foldersRes.data[index];
                return ListTile(
                  title: Text(folder.name, style: const TextStyle(color: Colors.white)),
                  onTap: () => Navigator.pop(context, folder),
                );
              },
            ),
          ),
        ),
      );

      if (selected != null) {
        setState(() => _selectedFolder = selected);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _startUpload() async {
    if (_selectedFiles.isEmpty || _selectedFolder == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select files and a destination folder')),
      );
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadProgress.clear();
      _uploadStatus.clear();
    });

    try {
      for (int i = 0; i < _selectedFiles.length; i++) {
        final file = _selectedFiles[i];
        setState(() {
          _uploadStatus[i] = 'Uploading...';
          _uploadProgress[i] = 0.5;
        });

        // Step 1: Upload File
        final uploadRes = await _apiService.uploadFile(file);
        
        setState(() {
          _uploadStatus[i] = 'Creating entry...';
          _uploadProgress[i] = 0.8;
        });

        // Step 2: Create Media Entry
        await _apiService.createMediaEntry({
          'folderId': _selectedFolder!.id,
          'fileName': file.path.split('/').last,
          'fileType': file.path.toLowerCase().endsWith('.mp4') || 
                      file.path.toLowerCase().endsWith('.mov') ||
                      file.path.toLowerCase().endsWith('.avi') ? 'video' : 'image',
          'fileFormat': file.path.split('.').last,
          'fileSize': await file.length(),
          'cdnUrl': uploadRes['cdnUrl'],
          'storagePath': uploadRes['cdnUrl'],
          'thumbnailUrl': uploadRes['thumbnailUrl'],
          'isCustomThumbnail': false,
        });

        setState(() {
          _uploadStatus[i] = 'Done';
          _uploadProgress[i] = 1.0;
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All files uploaded successfully!')),
        );
        Navigator.pop(context); // Close upload screen
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Upload Media', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildUploadOptions(),
                  const SizedBox(height: 24),
                  _buildFolderSelection(),
                  const SizedBox(height: 32),
                  if (_selectedFiles.isNotEmpty) _buildFileList(),
                ],
              ),
            ),
          ),
          _buildBottomAction(),
        ],
      ),
    );
  }

  Widget _buildUploadOptions() {
    return Row(
      children: [
        Expanded(
          child: TappableScale(
            onTap: _pickFiles,
            child: _buildUploadTypeCard(Icons.image_outlined, 'Images', 'Multi-select images'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TappableScale(
            onTap: _pickVideo,
            child: _buildUploadTypeCard(Icons.videocam_outlined, 'Video', 'Select a video'),
          ),
        ),
      ],
    );
  }

  Widget _buildUploadTypeCard(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.indigoAccent, size: 32),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.white24)),
        ],
      ),
    );
  }

  Widget _buildFolderSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Destination', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white70)),
        const SizedBox(height: 12),
        TappableScale(
          onTap: _selectFolder,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _selectedFolder == null ? Colors.amber.withOpacity(0.3) : Colors.white10),
            ),
            child: Row(
              children: [
                const Icon(Icons.folder_open_outlined, color: Colors.indigoAccent),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedFolder?.name ?? 'Select destination folder...',
                    style: TextStyle(color: _selectedFolder == null ? Colors.white30 : Colors.white),
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.white24),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFileList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Selected Files', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white70)),
            Text('${_selectedFiles.length} items', style: const TextStyle(fontSize: 12, color: Colors.white24)),
          ],
        ),
        const SizedBox(height: 16),
        ..._selectedFiles.asMap().entries.map((entry) => _buildFileItem(entry.key, entry.value)),
      ],
    );
  }

  Widget _buildFileItem(int index, File file) {
    final name = file.path.split('/').last;
    final progress = _uploadProgress[index] ?? 0.0;
    final status = _uploadStatus[index] ?? 'Ready';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(10)),
            child: Icon(
              file.path.toLowerCase().endsWith('.mp4') ? Icons.videocam_outlined : Icons.image_outlined,
              color: Colors.indigoAccent,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white))),
                    Text(status, style: TextStyle(fontSize: 10, color: status == 'Done' ? Colors.greenAccent : Colors.white30)),
                  ],
                ),
                if (_isUploading) ...[
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: LinearProgressIndicator(value: progress, backgroundColor: Colors.white10, valueColor: const AlwaysStoppedAnimation(Colors.indigoAccent)),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (!_isUploading)
            IconButton(
              icon: const Icon(Icons.close, size: 20, color: Colors.white24),
              onPressed: () => setState(() => _selectedFiles.removeAt(index)),
            ),
        ],
      ),
    );
  }

  Widget _buildBottomAction() {
    final bool canUpload = _selectedFiles.isNotEmpty && _selectedFolder != null && !_isUploading;
    
    return Container(
      padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).padding.bottom + 20),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: canUpload ? _startUpload : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.indigoAccent,
            disabledBackgroundColor: Colors.white10,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
          child: _isUploading
              ? const CircularProgressIndicator(color: Colors.white)
              : const Text('Start Upload', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
        ),
      ),
    );
  }
}
