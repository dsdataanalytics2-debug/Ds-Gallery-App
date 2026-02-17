import 'package:flutter/material.dart';
import '../api_service.dart';
import '../models.dart';
import 'media_preview_screen.dart';
import '../media_grid_screen.dart';
import 'dart:async';

class SearchOverlay extends StatefulWidget {
  const SearchOverlay({super.key});

  @override
  State<SearchOverlay> createState() => _SearchOverlayState();
}

class _SearchOverlayState extends State<SearchOverlay> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;
  
  List<Folder> _folderResults = [];
  List<Media> _imageResults = [];
  List<Media> _videoResults = [];
  bool _isSearching = false;

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (query.isNotEmpty) {
        _performSearch(query);
      } else {
        setState(() {
          _folderResults = [];
          _imageResults = [];
          _videoResults = [];
        });
      }
    });
  }

  Future<void> _performSearch(String query) async {
    setState(() => _isSearching = true);
    
    try {
      final folders = await _apiService.getFolders(search: query, limit: 10);
      final media = await _apiService.getMedia(search: query, limit: 30);
      
      if (mounted) {
        setState(() {
          _folderResults = folders.data;
          _imageResults = media.data.where((m) => m.fileType == 'image').toList();
          _videoResults = media.data.where((m) => m.fileType == 'video').toList();
          _isSearching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSearching = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Search error: $e')));
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: TextField(
          controller: _searchController,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          onChanged: _onSearchChanged,
          decoration: InputDecoration(
            hintText: 'Search assets and folders...',
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
            border: InputBorder.none,
            suffixIcon: _isSearching 
              ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.indigoAccent)))
              : IconButton(icon: const Icon(Icons.clear, color: Colors.white30), onPressed: () { _searchController.clear(); _onSearchChanged(''); }),
          ),
        ),
      ),
      body: _searchController.text.isEmpty
        ? _buildInitialState()
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_folderResults.isNotEmpty) _buildSearchSection('Folders', _folderResults),
              if (_imageResults.isNotEmpty) ...[
                const SizedBox(height: 24),
                _buildSearchSection('Images', _imageResults),
              ],
              if (_videoResults.isNotEmpty) ...[
                const SizedBox(height: 24),
                _buildSearchSection('Videos', _videoResults),
              ],
              if (!_isSearching && _folderResults.isEmpty && _imageResults.isEmpty && _videoResults.isEmpty)
                const Center(child: Padding(padding: EdgeInsets.only(top: 100), child: Text('No results found', style: TextStyle(color: Colors.white30)))),
            ],
          ),
    );
  }

  Widget _buildInitialState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search, size: 64, color: Colors.white10),
          const SizedBox(height: 16),
          const Text('Search for media and collections', style: TextStyle(color: Colors.white30)),
        ],
      ),
    );
  }

  Widget _buildSearchSection(String title, List items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.indigoAccent)),
            Text('${items.length} top results', style: const TextStyle(fontSize: 12, color: Colors.white24)),
          ],
        ),
        const SizedBox(height: 12),
        ...items.map((item) {
          if (item is Folder) {
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.folder_outlined, color: Colors.indigoAccent, size: 20),
              ),
              title: Text(item.name, style: const TextStyle(fontSize: 14, color: Colors.white70)),
              subtitle: Text('${item.mediaCount} assets', style: const TextStyle(fontSize: 12, color: Colors.white24)),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => MediaGridScreen(folder: item))),
              trailing: const Icon(Icons.chevron_right, color: Colors.white10),
            );
          } else if (item is Media) {
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  item.thumbnailUrl ?? item.cdnUrl,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(color: Colors.white.withOpacity(0.05), child: const Icon(Icons.image, size: 20, color: Colors.white24)),
                ),
              ),
              title: Text(item.fileName, style: const TextStyle(fontSize: 14, color: Colors.white70)),
              subtitle: Text(item.fileFormat.toUpperCase(), style: const TextStyle(fontSize: 12, color: Colors.white24)),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => MediaPreviewScreen(media: item))),
              trailing: const Icon(Icons.chevron_right, color: Colors.white10),
            );
          }
          return const SizedBox.shrink();
        }).toList(),
      ],
    );
  }
}
