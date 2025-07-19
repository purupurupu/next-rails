# Todos API

## Overview

The Todos API provides CRUD operations for managing todo items. All endpoints require authentication and return only the authenticated user's todos.

## Authentication Required

All todo endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### List Todos

Get all todos for the authenticated user.

**Endpoint:** `GET /api/todos`

**Query Parameters:** None

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "completed": false,
    "position": 0,
    "due_date": "2024-12-31",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Review pull requests",
    "completed": true,
    "position": 1,
    "due_date": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
]
```

**Notes:**
- Todos are returned ordered by `position`
- Empty array `[]` if no todos exist

### Get Single Todo

Get a specific todo by ID.

**Endpoint:** `GET /api/todos/:id`

**URL Parameters:**
- `id` (required): Todo ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "completed": false,
  "position": 0,
  "due_date": "2024-12-31",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Record not found"
}
```

### Create Todo

Create a new todo item.

**Endpoint:** `POST /api/todos`

**Request Body:**
```json
{
  "todo": {
    "title": "New task",
    "due_date": "2024-12-31"
  }
}
```

**Parameters:**
- `title` (required): Todo description
- `due_date` (optional): Due date in YYYY-MM-DD format
- `completed` (optional): Defaults to `false`

**Success Response (201 Created):**
```json
{
  "id": 3,
  "title": "New task",
  "completed": false,
  "position": 2,
  "due_date": "2024-12-31",
  "created_at": "2024-01-03T00:00:00.000Z",
  "updated_at": "2024-01-03T00:00:00.000Z"
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": {
    "title": ["can't be blank"],
    "due_date": ["must be in the future"]
  }
}
```

### Update Todo

Update an existing todo.

**Endpoint:** `PUT /api/todos/:id` or `PATCH /api/todos/:id`

**URL Parameters:**
- `id` (required): Todo ID

**Request Body:**
```json
{
  "todo": {
    "title": "Updated task",
    "completed": true,
    "due_date": "2024-12-31"
  }
}
```

**Parameters:**
- `title` (optional): New title
- `completed` (optional): Completion status
- `due_date` (optional): New due date

**Success Response (200 OK):**
```json
{
  "id": 1,
  "title": "Updated task",
  "completed": true,
  "position": 0,
  "due_date": "2024-12-31",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-03T00:00:00.000Z"
}
```

### Delete Todo

Delete a todo item.

**Endpoint:** `DELETE /api/todos/:id`

**URL Parameters:**
- `id` (required): Todo ID

**Success Response (204 No Content):**
No response body

**Error Response (404 Not Found):**
```json
{
  "error": "Record not found"
}
```

### Update Todo Order

Bulk update todo positions for drag-and-drop reordering.

**Endpoint:** `PATCH /api/todos/update_order`

**Request Body:**
```json
{
  "todos": [
    { "id": 3, "position": 0 },
    { "id": 1, "position": 1 },
    { "id": 2, "position": 2 }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "message": "Order updated successfully"
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "error": "Invalid todo IDs"
}
```

**Notes:**
- All todos must belong to the authenticated user
- Invalid IDs will cause the entire operation to fail
- Positions should be sequential starting from 0

## Data Validation

### Title
- Required field
- Cannot be empty
- Maximum length: 255 characters

### Due Date
- Optional field
- Format: YYYY-MM-DD
- Must be today or in the future (on creation)
- Can be any date on update

### Position
- Automatically assigned on creation
- Should be unique among user's todos
- Used for ordering in the UI

## Filtering and Sorting

Currently, todos are always returned ordered by position. Client-side filtering is recommended for:
- Active todos (completed: false)
- Completed todos (completed: true)
- Overdue todos (due_date < today)

## Frontend Integration Example

```javascript
class TodoApiClient {
  constructor(token) {
    this.token = token;
    this.baseURL = '/api/todos';
  }

  async getAll() {
    const response = await fetch(this.baseURL, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }

  async create(todoData) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ todo: todoData })
    });
    return response.json();
  }

  async updateOrder(todos) {
    const response = await fetch(`${this.baseURL}/update_order`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ todos })
    });
    return response.json();
  }
}
```

## Performance Considerations

1. **Batch Operations**: Use `update_order` for bulk position updates
2. **Caching**: Consider caching todo list on frontend
3. **Optimistic Updates**: Update UI before API confirmation
4. **Pagination**: Not implemented yet, but recommended for large lists