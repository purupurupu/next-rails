# Notes API

## Overview

The Notes API provides CRUD operations for managing markdown notes with revision history. All endpoints require authentication and return only the authenticated user's notes.

## Authentication Required

All note endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Base URL

All endpoints are prefixed with `/api/v1`:
```
http://localhost:3001/api/v1/notes
```

## Endpoints

### List Notes

Get all notes for the authenticated user.

**Endpoint:** `GET /api/v1/notes`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` or `query` or `search` | string | Search in title and body |
| `archived` | boolean | Show archived notes only |
| `trashed` | boolean | Show trashed notes only |
| `pinned` | boolean | Filter by pinned status |
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Items per page (default: 25) |

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Meeting Notes",
      "body_md": "# Meeting Summary\n\n- Discussed project timeline...",
      "pinned": true,
      "archived": false,
      "trashed": false,
      "archived_at": null,
      "trashed_at": null,
      "last_edited_at": "2024-01-15T10:30:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 1,
    "per_page": 25,
    "filters": {
      "archived": false,
      "trashed": false
    }
  },
  "message": "Notes retrieved successfully"
}
```

**Notes:**
- Notes are ordered by pinned status (pinned first), then by `last_edited_at` descending
- By default, only active notes (not archived or trashed) are returned
- Use `archived=true` to get archived notes only
- Use `trashed=true` to get trashed notes only

### Get Single Note

Get a specific note by ID.

**Endpoint:** `GET /api/v1/notes/:id`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Note ID (required) |

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "title": "Meeting Notes",
    "body_md": "# Meeting Summary\n\n- Discussed project timeline...",
    "pinned": true,
    "archived": false,
    "trashed": false,
    "archived_at": null,
    "trashed_at": null,
    "last_edited_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Note retrieved successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Note not found"
}
```

### Create Note

Create a new note.

**Endpoint:** `POST /api/v1/notes`

**Request Body:**
```json
{
  "note": {
    "title": "New Note",
    "body_md": "# My Note\n\nContent here...",
    "pinned": false
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | No | Note title (max 150 characters) |
| `body_md` | string | No | Markdown content (max 100,000 characters) |
| `pinned` | boolean | No | Pin note to top (default: false) |

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 2,
    "title": "New Note",
    "body_md": "# My Note\n\nContent here...",
    "pinned": false,
    "archived": false,
    "trashed": false,
    "archived_at": null,
    "trashed_at": null,
    "last_edited_at": "2024-01-15T11:00:00.000Z",
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  },
  "message": "Note created successfully"
}
```

**Error Response (422 Unprocessable Content):**
```json
{
  "errors": {
    "title": ["is too long (maximum is 150 characters)"]
  }
}
```

### Update Note

Update an existing note.

**Endpoint:** `PATCH /api/v1/notes/:id` or `PUT /api/v1/notes/:id`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Note ID (required) |

**Request Body:**
```json
{
  "note": {
    "title": "Updated Title",
    "body_md": "# Updated Content",
    "pinned": true,
    "archived": false,
    "trashed": false
  }
}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Note title (max 150 characters) |
| `body_md` | string | Markdown content (max 100,000 characters) |
| `pinned` | boolean | Pin note to top |
| `archived` | boolean | Archive/unarchive note |
| `trashed` | boolean | Move to/restore from trash |

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "title": "Updated Title",
    "body_md": "# Updated Content",
    "pinned": true,
    "archived": false,
    "trashed": false,
    "archived_at": null,
    "trashed_at": null,
    "last_edited_at": "2024-01-15T12:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  },
  "message": "Note updated successfully"
}
```

**Notes:**
- Setting `archived: true` sets `archived_at` to current time
- Setting `archived: false` clears `archived_at`
- Same behavior for `trashed` and `trashed_at`
- Each content change (title or body_md) creates a new revision

### Delete Note

Delete a note (soft delete to trash or permanent delete).

**Endpoint:** `DELETE /api/v1/notes/:id`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Note ID (required) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `force` | boolean | Permanently delete (default: false) |

**Soft Delete Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "title": "Deleted Note",
    "trashed": true,
    "trashed_at": "2024-01-15T13:00:00.000Z"
  },
  "message": "Note moved to trash"
}
```

**Force Delete Response (204 No Content):**
Empty response body

**Notes:**
- Without `force=true`, the note is moved to trash (soft delete)
- With `force=true`, the note is permanently deleted
- Trashed notes can be restored using `PATCH /api/v1/notes/:id` with `trashed: false`

---

## Note Revisions API

Notes automatically track revision history. Each content change creates a new revision.

### List Revisions

Get revision history for a note.

**Endpoint:** `GET /api/v1/notes/:note_id/revisions`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `note_id` | integer | Note ID (required) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Items per page (default: 25) |

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 5,
      "note_id": 1,
      "title": "Meeting Notes v3",
      "body_md": "# Updated content...",
      "created_at": "2024-01-15T12:00:00.000Z"
    },
    {
      "id": 4,
      "note_id": 1,
      "title": "Meeting Notes v2",
      "body_md": "# Previous content...",
      "created_at": "2024-01-10T10:00:00.000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 2,
    "per_page": 25
  },
  "message": "Revisions retrieved successfully"
}
```

**Notes:**
- Revisions are ordered by `created_at` descending (newest first)
- Maximum 50 revisions are kept per note (oldest are automatically pruned)

### Restore Revision

Restore a note to a previous revision.

**Endpoint:** `POST /api/v1/notes/:note_id/revisions/:id/restore`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `note_id` | integer | Note ID (required) |
| `id` | integer | Revision ID (required) |

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "title": "Meeting Notes v2",
    "body_md": "# Previous content...",
    "pinned": true,
    "archived": false,
    "trashed": false,
    "last_edited_at": "2024-01-15T14:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T14:00:00.000Z"
  },
  "message": "Revision restored successfully"
}
```

**Notes:**
- Restoring a revision updates the note's content to match the revision
- A new revision is created after restore (capturing the restoration)
- The original revision remains in history

---

## Data Models

### Note Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier |
| `title` | string | Note title (max 150 chars) |
| `body_md` | string | Markdown content (max 100,000 chars) |
| `pinned` | boolean | Whether note is pinned |
| `archived` | boolean | Whether note is archived |
| `trashed` | boolean | Whether note is in trash |
| `archived_at` | datetime | When note was archived (null if not) |
| `trashed_at` | datetime | When note was trashed (null if not) |
| `last_edited_at` | datetime | When content was last edited |
| `created_at` | datetime | When note was created |
| `updated_at` | datetime | When note was last updated |

### Note Revision Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique identifier |
| `note_id` | integer | Parent note ID |
| `title` | string | Title at this revision |
| `body_md` | string | Content at this revision |
| `created_at` | datetime | When revision was created |

---

## Examples

### Create and Edit Note

```bash
# Create a new note
curl -X POST http://localhost:3001/api/v1/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "title": "Project Ideas",
      "body_md": "# Ideas\n\n- Feature A\n- Feature B"
    }
  }'

# Update the note
curl -X PATCH http://localhost:3001/api/v1/notes/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "body_md": "# Ideas\n\n- Feature A\n- Feature B\n- Feature C"
    }
  }'
```

### Archive and Restore Note

```bash
# Archive note
curl -X PATCH http://localhost:3001/api/v1/notes/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note": {"archived": true}}'

# Restore from archive
curl -X PATCH http://localhost:3001/api/v1/notes/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note": {"archived": false}}'
```

### Work with Revisions

```bash
# Get revision history
curl http://localhost:3001/api/v1/notes/1/revisions \
  -H "Authorization: Bearer $TOKEN"

# Restore to previous revision
curl -X POST http://localhost:3001/api/v1/notes/1/revisions/3/restore \
  -H "Authorization: Bearer $TOKEN"
```

### Search Notes

```bash
# Search by keyword
curl "http://localhost:3001/api/v1/notes?q=meeting" \
  -H "Authorization: Bearer $TOKEN"

# Get archived notes
curl "http://localhost:3001/api/v1/notes?archived=true" \
  -H "Authorization: Bearer $TOKEN"

# Get pinned notes only
curl "http://localhost:3001/api/v1/notes?pinned=true" \
  -H "Authorization: Bearer $TOKEN"
```
