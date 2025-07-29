# API Versioning

This document describes the API versioning system and how to use it.

## Overview

The Todo API supports multiple versioning strategies to accommodate different client needs:

1. **URL Path Versioning** (Recommended)
2. **Accept Header Versioning**
3. **Custom Header Versioning**

All methods are supported simultaneously, allowing clients to choose their preferred approach.

## Current Version

- **Current Version**: `v1`
- **Base URL**: `https://api.example.com/api/v1`
- **Status**: Stable

## Versioning Methods

### 1. URL Path Versioning (Recommended)

Include the version in the URL path:

```http
GET https://api.example.com/api/v1/todos
Authorization: Bearer <token>
```

**Advantages**:
- Simple and explicit
- Easy to test with browsers and tools
- Clear in logs and debugging

### 2. Accept Header Versioning

Specify the version in the Accept header:

```http
GET https://api.example.com/api/todos
Accept: application/vnd.todo-api.v1+json
Authorization: Bearer <token>
```

**Format**: `application/vnd.todo-api.v{version}+json`

**Advantages**:
- Keeps URLs clean
- Follows REST principles
- Allows content negotiation

### 3. Custom Header Versioning

Use the `X-API-Version` header:

```http
GET https://api.example.com/api/todos
X-API-Version: v1
Authorization: Bearer <token>
```

**Advantages**:
- Simple to implement
- Works with any HTTP method
- Easy to add to existing clients

## Version Response Headers

All API responses include version information:

```http
HTTP/1.1 200 OK
X-API-Version: v1
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
```

## Deprecation Policy

### Deprecation Timeline

1. **Announcement**: 6 months before deprecation
2. **Deprecation Warnings**: 3 months before removal
3. **End of Life**: Version removed from service

### Deprecation Warnings

When using a deprecated version or unversioned endpoints:

```http
HTTP/1.1 200 OK
X-API-Version: v1
X-API-Deprecation: true
X-API-Deprecation-Date: 2025-12-31
Warning: 299 - "This API version is deprecated and will be removed on 2025-12-31. Please migrate to v2."
```

### Unversioned Endpoint Warning

Accessing endpoints without version specification:

```http
GET https://api.example.com/api/todos
```

Response includes:
```http
Warning: 299 - "Unversioned API access is deprecated. Please specify API version using /api/v1/ path, Accept header, or X-API-Version header."
```

## Version Differences

### Breaking Changes

A new API version is created when introducing breaking changes:

- Removing endpoints or fields
- Changing field types or formats
- Modifying authentication methods
- Altering business logic significantly
- Changing error response formats

### Non-Breaking Changes

These changes don't require a new version:

- Adding new endpoints
- Adding optional fields to requests
- Adding fields to responses
- Performance improvements
- Bug fixes
- Documentation updates

## Migration Guide

### Migrating from Unversioned to v1

1. **Update Base URL**:
   ```javascript
   // Old
   const API_BASE = 'https://api.example.com/api';
   
   // New
   const API_BASE = 'https://api.example.com/api/v1';
   ```

2. **Or use headers**:
   ```javascript
   // Using Accept header
   fetch('/api/todos', {
     headers: {
       'Accept': 'application/vnd.todo-api.v1+json',
       'Authorization': `Bearer ${token}`
     }
   });
   
   // Using custom header
   fetch('/api/todos', {
     headers: {
       'X-API-Version': 'v1',
       'Authorization': `Bearer ${token}`
     }
   });
   ```

### Client Implementation Examples

#### JavaScript/TypeScript

```typescript
class TodoApiClient {
  private baseUrl = 'https://api.example.com';
  private version = 'v1';
  
  // URL-based versioning
  async getTodos() {
    const response = await fetch(`${this.baseUrl}/api/${this.version}/todos`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
  
  // Header-based versioning
  async getTodosWithHeader() {
    const response = await fetch(`${this.baseUrl}/api/todos`, {
      headers: {
        'X-API-Version': this.version,
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
}
```

#### Ruby

```ruby
require 'net/http'
require 'uri'

class TodoApiClient
  BASE_URL = 'https://api.example.com'
  VERSION = 'v1'
  
  # URL-based versioning
  def get_todos
    uri = URI("#{BASE_URL}/api/#{VERSION}/todos")
    request = Net::HTTP::Get.new(uri)
    request['Authorization'] = "Bearer #{@token}"
    
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    
    JSON.parse(response.body)
  end
  
  # Header-based versioning
  def get_todos_with_header
    uri = URI("#{BASE_URL}/api/todos")
    request = Net::HTTP::Get.new(uri)
    request['X-API-Version'] = VERSION
    request['Authorization'] = "Bearer #{@token}"
    
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    
    JSON.parse(response.body)
  end
end
```

#### Python

```python
import requests

class TodoApiClient:
    BASE_URL = 'https://api.example.com'
    VERSION = 'v1'
    
    def __init__(self, token):
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
    
    # URL-based versioning
    def get_todos(self):
        response = self.session.get(f'{self.BASE_URL}/api/{self.VERSION}/todos')
        return response.json()
    
    # Header-based versioning
    def get_todos_with_header(self):
        response = self.session.get(
            f'{self.BASE_URL}/api/todos',
            headers={'X-API-Version': self.VERSION}
        )
        return response.json()
```

## Version Support Matrix

| Version | Status | Release Date | End of Life | Notes |
|---------|--------|--------------|-------------|-------|
| v1 | **Active** | 2025-01-01 | N/A | Current stable version |
| Unversioned | Deprecated | - | 2025-06-30 | Legacy support only |

## Best Practices

### For API Consumers

1. **Always specify a version** - Don't rely on default behavior
2. **Monitor deprecation warnings** - Check response headers
3. **Test against new versions early** - Use staging environment
4. **Update regularly** - Don't wait until deprecation

### Version Selection Strategy

```javascript
// Good: Explicit version configuration
const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL,
  version: process.env.API_VERSION || 'v1',
  
  getUrl(endpoint) {
    return `${this.baseUrl}/api/${this.version}${endpoint}`;
  }
};

// Usage
fetch(API_CONFIG.getUrl('/todos'), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Handling Version Errors

```javascript
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(endpoint, options);
  
  // Check for deprecation warnings
  const deprecationWarning = response.headers.get('Warning');
  if (deprecationWarning) {
    console.warn('API Deprecation Warning:', deprecationWarning);
    // Log to monitoring service
  }
  
  // Handle version-specific errors
  if (response.status === 404) {
    const error = await response.json();
    if (error.error.code === 'VERSION_NOT_FOUND') {
      throw new Error(`API version not supported: ${error.error.details.requested_version}`);
    }
  }
  
  return response;
}
```

## Future Versions

### Version 2 (Planned)

**Planned Changes**:
- GraphQL support alongside REST
- Webhook system for real-time updates
- Advanced filtering with JSON:API syntax
- Batch operations endpoint

**Migration Period**: 12 months from v2 release

### Version Roadmap

- **v1.1** (Minor): Additional search capabilities
- **v1.2** (Minor): Performance optimizations
- **v2.0** (Major): GraphQL and breaking changes
- **v2.1** (Minor): WebSocket support

## FAQ

### Q: What happens if I don't specify a version?

A: The API will default to v1 but include deprecation warnings. Unversioned access will be disabled in the future.

### Q: Can I use multiple versioning methods together?

A: Yes, but only one will be used. Priority: URL path > Accept header > X-API-Version header

### Q: How do I know which version I'm using?

A: Check the `X-API-Version` response header. It's included in every API response.

### Q: Will old versions receive bug fixes?

A: Critical security fixes only. New features and non-critical fixes are only added to the current version.

### Q: How can I test against future versions?

A: Use our staging environment: `https://staging-api.example.com/api/v2`

## Support

For version-specific questions or migration assistance:

- Documentation: https://docs.example.com/api/versioning
- Support: api-support@example.com
- Status Page: https://status.example.com