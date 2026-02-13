import 'package:flutter/material.dart';
import 'api_service.dart';
import 'models.dart';
import 'media_grid_screen.dart';
import 'package:intl/intl.dart';
import 'auth_service.dart';
import 'login_screen.dart';

class FolderListScreen extends StatefulWidget {
  const FolderListScreen({super.key});

  @override
  State<FolderListScreen> createState() => _FolderListScreenState();
}

class _FolderListScreenState extends State<FolderListScreen> {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();
  late Future<List<Folder>> _foldersFuture;

  @override
  void initState() {
    super.initState();
    _foldersFuture = _apiService.getFolders();
  }

  void _handleLogout() async {
    await _authService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('DS Gallery'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: FutureBuilder<List<Folder>>(
        future: _foldersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No folders found'));
          }

          final folders = snapshot.data!;
          return ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: folders.length,
            itemBuilder: (context, index) {
              final folder = folders[index];
              return Card(
                elevation: 2,
                margin: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  title: Text(
                    folder.name,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (folder.description != null)
                        Text(folder.description!, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Text(
                        '${folder.mediaCount} items • ${DateFormat.yMMMd().format(folder.createdAt)}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MediaGridScreen(folder: folder),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
