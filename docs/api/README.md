# API Documentation

## Overview

The Todo application provides a RESTful JSON API built with Rails API-only mode. All endpoints return JSON responses and require JSON request bodies where applicable.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: Configure in deployment

## Authentication

Most API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Common Headers

### Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt_token>
```

### Response Headers
```
Content-Type: application/json
X-Request-Id: <unique_request_id>
```

## Response Format (UNIFIED)

### Success Response with Data
```json
{
  "message": "Todo created successfully",
  "data": {
    "id": 1,
    "title": "Complete project",
    "completed": false,
    "position": 0,
    "due_date": "2024-12-31",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Success Response (Message Only)
```json
{
  "message": "Logged out successfully"
}
```

### Resource List Response
```json
[
  {
    "id": 1,
    "title": "Complete project",
    "completed": false,
    "position": 0,
    "due_date": "2024-12-31"
  }
]
```

### Error Response
```json
{
  "error": "Record not found"
}
```

### Validation Error Response
```json
{
  "errors": {
    "title": ["can't be blank"],
    "due_date": ["must be in the future"]
  }
}
```

## HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

## API Endpoints

### Authentication
- [Authentication API](./authentication.md) - User registration, login, and logout

### Resources
- [Todos API](./todos.md) - Todo CRUD operations and batch updates
- [Categories API](./categories.md) - Category CRUD operations
- [Tags API](./tags.md) - Tag CRUD operations for flexible todo organization

## Pagination

Currently not implemented. Future versions may include:
```
GET /api/todos?page=1&per_page=20
```

## Rate Limiting

Currently not implemented. Future versions may include rate limiting headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Versioning

Currently using unversioned API. Future versions may use:
- URL versioning: `/api/v1/todos`
- Header versioning: `Accept: application/vnd.api+json;version=1`

## CORS

CORS is configured to allow requests from:
- Development: `http://localhost:3000`
- Production: Configure allowed origins

## Request Examples

### Using cURL
```bash
# Login
curl -X POST http://localhost:3001/auth/sign_in \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"user@example.com","password":"password"}}'

# Get todos
curl -X GET http://localhost:3001/api/todos \
  -H "Authorization: Bearer <jwt_token>"
```

### Using JavaScript (Fetch)
```javascript
// Login
const response = await fetch('http://localhost:3001/auth/sign_in', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user: { email: 'user@example.com', password: 'password' }
  })
});

// Get todos
const todos = await fetch('http://localhost:3001/api/todos', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json());
```

## Error Handling Best Practices

1. Always check response status before parsing
2. Handle network errors separately from API errors
3. Display user-friendly error messages
4. Log errors for debugging
5. Implement retry logic for transient failures

## Security Considerations

1. Always use HTTPS in production
2. Store JWT tokens securely (HttpOnly cookies recommended)
3. Implement token refresh mechanism
4. Validate all input on both client and server
5. Use CORS to restrict origins
6. Implement rate limiting in production