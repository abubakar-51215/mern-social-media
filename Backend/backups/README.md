# Backups Directory

This directory stores database backups created through the admin settings panel.

## Backup Types

1. **JSON Backups** (`.json` files)
   - Fallback format when mongodump is not available
   - Contains all collections in JSON format
   - Can be restored through the admin panel

2. **MongoDB Backups** (directories)
   - Created using mongodump utility
   - BSON format for better performance
   - Requires mongorestore to restore

## Important Notes

- Backups are stored locally on the server
- For production, consider storing backups in cloud storage (S3, Azure Blob, etc.)
- Regular backups are recommended based on your backup frequency setting
- Old backups should be manually deleted when no longer needed
