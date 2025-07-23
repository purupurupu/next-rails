# Todo File Uploads API

This document describes the file upload functionality for todos.

## Overview

Todos can have multiple file attachments using Rails Active Storage. Files are stored locally in development and can be configured for cloud storage (AWS S3, Google Cloud Storage, etc.) in production.

## Endpoints

### Upload Files with Todo Creation

**POST** `/api/todos`

When creating a new todo, you can attach multiple files:

```bash
curl -X POST http://localhost:3001/api/todos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "todo[title]=Todo with attachments" \
  -F "todo[description]=This todo has files" \
  -F "todo[files][]=@/path/to/file1.pdf" \
  -F "todo[files][]=@/path/to/file2.jpg"
```

### Update Todo with Additional Files

**PUT/PATCH** `/api/todos/:id`

Add more files to an existing todo:

```bash
curl -X PATCH http://localhost:3001/api/todos/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "todo[files][]=@/path/to/newfile.docx"
```

**Note**: This adds new files without removing existing ones.

### Delete a Specific File

**DELETE** `/api/todos/:todo_id/files/:file_id`

Remove a specific file from a todo:

```bash
curl -X DELETE http://localhost:3001/api/todos/1/files/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

Todos with files include a `files` array in the response:

```json
{
  "id": 1,
  "title": "Todo with attachments",
  "completed": false,
  "files": [
    {
      "id": 123,
      "filename": "document.pdf",
      "content_type": "application/pdf",
      "byte_size": 102400,
      "url": "http://localhost:3001/rails/active_storage/blobs/redirect/..."
    },
    {
      "id": 124,
      "filename": "image.jpg",
      "content_type": "image/jpeg",
      "byte_size": 51200,
      "url": "http://localhost:3001/rails/active_storage/blobs/redirect/..."
    }
  ],
  // ... other todo fields
}
```

## File Information

Each file object contains:
- `id`: Unique identifier for the attachment
- `filename`: Original filename
- `content_type`: MIME type of the file
- `byte_size`: File size in bytes
- `url`: Direct URL to download the file

## Frontend Implementation Notes

### File Upload Form

Use multipart form data when uploading files:

```javascript
const formData = new FormData();
formData.append('todo[title]', 'My Todo');
formData.append('todo[description]', 'Description');

// Add multiple files
files.forEach(file => {
  formData.append('todo[files][]', file);
});

fetch('/api/todos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type - let browser set it with boundary
  },
  body: formData
});
```

### Display Files

Files can be displayed or downloaded using the provided URLs:

```javascript
// Download link
<a href={file.url} download={file.filename}>
  Download {file.filename}
</a>

// Display image
{file.content_type.startsWith('image/') && (
  <img src={file.url} alt={file.filename} />
)}
```

## Storage Configuration

### Development
Files are stored locally in the `storage` directory.

### Production
Configure `config/storage.yml` for cloud storage:

```yaml
amazon:
  service: S3
  access_key_id: <%= Rails.application.credentials.dig(:aws, :access_key_id) %>
  secret_access_key: <%= Rails.application.credentials.dig(:aws, :secret_access_key) %>
  region: us-east-1
  bucket: your-bucket-name
```

Then update `config/environments/production.rb`:

```ruby
config.active_storage.service = :amazon
```

## File Size Limits

Consider adding validations to the Todo model:

```ruby
class Todo < ApplicationRecord
  has_many_attached :files
  
  validate :acceptable_files

  private

  def acceptable_files
    return unless files.attached?
    
    files.each do |file|
      unless file.blob.byte_size <= 10.megabytes
        errors.add(:files, "#{file.filename} is too large (max 10MB)")
      end
      
      unless acceptable_types.include?(file.content_type)
        errors.add(:files, "#{file.filename} has an invalid content type")
      end
    end
  end
  
  def acceptable_types
    ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
     'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  end
end
```

## Security Considerations

1. **File Type Validation**: Always validate file types on the server side
2. **File Size Limits**: Implement reasonable file size limits
3. **Virus Scanning**: Consider integrating virus scanning for uploaded files
4. **Access Control**: Files inherit the same access control as their parent todo
5. **Direct Upload**: For large files, consider implementing direct uploads to cloud storage

## CORS Configuration

The backend CORS configuration already allows file uploads from the frontend at `localhost:3000`. The Active Storage URLs are automatically served with proper CORS headers.