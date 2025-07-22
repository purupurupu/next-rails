# Implementation Plan

- [x] 1. Set up enhanced project structure and dependencies

  - Add required gems to Gemfile (devise, jwt, active_model_serializers, etc.)
  - Configure database for new tables and relationships
  - Set up RSpec testing framework with Factory Bot
  - _Requirements: 8.1, 9.1, 9.2_

- [x] 2. Implement user authentication system
- [x] 2.1 Create User model with Devise

  - Generate User model with Devise configuration
  - Add custom fields (name) to User model
  - Write comprehensive tests for User model validations and associations
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Configure devise-jwt authentication

  - Configure devise-jwt in initializers with proper settings
  - Create JwtDenylist model for token revocation strategy
  - Set up JWT dispatch and revocation request patterns
  - Write unit tests for JWT authentication functionality
  - _Requirements: 1.3_

- [x] 2.3 Create authentication API endpoints

  - Implement registration, login, and logout endpoints
  - Add proper error handling for authentication failures
  - Write integration tests for authentication flow
  - _Requirements: 1.1, 1.2_

- [x] 2.4 Test frontend-backend authentication integration

  - Update frontend API client to handle JWT authentication
  - Implement login/logout functionality in frontend
  - Test authentication flow between frontend and backend
  - Verify JWT token storage and automatic inclusion in requests
  - Add basic error handling for authentication failures
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Extend Todo model with enhanced features
- [x] 3.1 Add user association to existing Todo model

  - Create migration to add user_id to todos table
  - Update Todo model to belong_to user
  - Modify existing todo operations to be user-scoped
  - _Requirements: 1.4, 1.5_

- [x] 3.2 Add priority and status enums to Todo model

  - Create migration to add priority and status columns
  - Implement enum definitions in Todo model
  - Add validation and default values
  - Write tests for enum functionality
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3.3 Add description field to Todo model

  - Create migration to add description column to todos
  - Update Todo model validations and permitted parameters
  - Modify serializers to include description field
  - _Requirements: 3.3_

- [x] 4. Implement Category system
- [x] 4.1 Create Category model and associations

  - Generate Category model with user association
  - Create migration for categories table with proper indexes
  - Implement Category-Todo relationship (belongs_to)
  - Write comprehensive model tests
  - _Requirements: 2.1, 2.5_

- [x] 4.2 Create Category API endpoints

  - Implement CRUD operations for categories
  - Add proper authorization (user can only manage own categories)
  - Create CategorySerializer for JSON responses
  - Write integration tests for category endpoints
  - _Requirements: 2.5_

- [x] 4.3 Update Todo model to support categories

  - Add category_id to todos table migration
  - Update Todo model with category association
  - Modify todo serializer to include category information
  - Update todo controller to handle category assignment
  - _Requirements: 2.1, 2.3_

- [ ] 5. Implement Tag system with many-to-many relationships
- [ ] 5.1 Create Tag model and junction table

  - Generate Tag model with proper validations
  - Create TodoTag junction model for many-to-many relationship
  - Implement has_many :through associations in Todo and Tag models
  - Write tests for tag associations and validations
  - _Requirements: 2.2, 2.6_

- [ ] 5.2 Create Tag API endpoints

  - Implement tag CRUD operations
  - Add tag search and autocomplete functionality
  - Create TagSerializer for consistent JSON responses
  - Write integration tests for tag management
  - _Requirements: 2.6_

- [ ] 5.3 Update Todo operations to handle tags

  - Modify todo creation/update to accept tag assignments
  - Implement tag filtering in todo list endpoint
  - Update TodoSerializer to include associated tags
  - Add tests for todo-tag operations
  - _Requirements: 2.2, 2.4_

- [ ] 6. Implement file attachment system with Active Storage
- [ ] 6.1 Configure Active Storage for file attachments

  - Set up Active Storage configuration
  - Create migration for Active Storage tables
  - Configure image processing for automatic resizing
  - Set up file storage service (local/cloud)
  - _Requirements: 4.1, 4.2_

- [ ] 6.2 Add file attachment to Todo model

  - Add has_many_attached :attachments to Todo model
  - Create file upload endpoint for todos
  - Implement secure file serving with proper authorization
  - Write tests for file upload and retrieval
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 6.3 Handle file cleanup and validation

  - Add file type and size validations
  - Implement automatic cleanup when todos are deleted
  - Add image optimization and thumbnail generation
  - Write tests for file validation and cleanup
  - _Requirements: 4.2, 4.5_

- [ ] 7. Create polymorphic comment system
- [ ] 7.1 Create Comment model with polymorphic associations

  - Generate Comment model with polymorphic commentable association
  - Create migration with proper indexes for polymorphic queries
  - Implement user association for comment ownership
  - Write comprehensive tests for polymorphic associations
  - _Requirements: 5.1, 5.2_

- [ ] 7.2 Implement comment API endpoints

  - Create nested comment routes under todos
  - Implement comment CRUD operations with proper authorization
  - Add soft delete functionality for comment history preservation
  - Write integration tests for comment operations
  - _Requirements: 5.1, 5.5_

- [ ] 7.3 Create todo history tracking system

  - Generate TodoHistory model to track changes
  - Implement before_update callback in Todo model to record changes
  - Create history viewing endpoint with proper formatting
  - Write tests for change tracking functionality
  - _Requirements: 5.3, 5.4_

- [ ] 8. Implement background job system for notifications
- [ ] 8.1 Set up Active Job with Sidekiq

  - Add Sidekiq gem and configure Redis connection
  - Set up job queues and worker configuration
  - Create base job classes with error handling
  - Write tests for job execution and error scenarios
  - _Requirements: 6.3, 6.5_

- [ ] 8.2 Create notification job system

  - Implement NotificationJob for status change notifications
  - Create ReminderJob for due date notifications
  - Add job scheduling for periodic reminder checks
  - Write tests for notification job execution
  - _Requirements: 6.1, 6.4_

- [ ] 8.3 Implement email notification system

  - Configure Action Mailer with SMTP settings
  - Create TodoMailer with status change and reminder templates
  - Add user notification preferences model
  - Write tests for email generation and delivery
  - _Requirements: 6.1, 6.2_

- [ ] 9. Create advanced search and filtering system
- [ ] 9.1 Implement TodoSearchService

  - Create service object for complex search logic
  - Add full-text search across title and description
  - Implement filtering by category, status, priority, and tags
  - Write comprehensive tests for search functionality
  - _Requirements: 7.1, 7.2_

- [ ] 9.2 Add search API endpoints

  - Create search endpoint with parameter validation
  - Implement result highlighting for search terms
  - Add pagination for large result sets
  - Write integration tests for search API
  - _Requirements: 7.3, 7.4, 7.5_

- [ ] 9.3 Optimize search performance

  - Add database indexes for search columns
  - Implement query optimization to avoid N+1 problems
  - Add caching for frequently searched terms
  - Write performance tests and benchmarks
  - _Requirements: 10.1, 10.2_

- [ ] 10. Enhance API design with serializers and versioning
- [ ] 10.1 Implement JSON API serializers

  - Create comprehensive serializers for all models
  - Implement nested resource serialization
  - Add computed fields and custom attributes
  - Write tests for serializer output format
  - _Requirements: 8.1, 8.2_

- [ ] 10.2 Add API versioning support

  - Implement API versioning through URL namespacing
  - Create version-specific controllers and serializers
  - Add backward compatibility handling
  - Write tests for version compatibility
  - _Requirements: 8.3_

- [ ] 10.3 Improve error handling and API documentation

  - Implement standardized error response format
  - Add comprehensive API error handling
  - Generate API documentation with examples
  - Write tests for error response consistency
  - _Requirements: 8.4, 8.5_

- [ ] 11. Implement comprehensive testing suite
- [ ] 11.1 Create model test suite

  - Write unit tests for all model validations and associations
  - Add tests for custom model methods and scopes
  - Implement factory definitions for all models
  - Achieve high test coverage for model layer
  - _Requirements: 9.1, 9.3_

- [ ] 11.2 Create controller and integration test suite

  - Write integration tests for all API endpoints
  - Add authentication and authorization tests
  - Implement request/response format validation tests
  - Test error handling and edge cases
  - _Requirements: 9.2, 9.5_

- [ ] 11.3 Add service and job testing

  - Write unit tests for all service objects
  - Add tests for background job execution
  - Implement email delivery testing
  - Test file upload and processing functionality
  - _Requirements: 9.1, 9.4_

- [ ] 12. Implement performance optimizations
- [ ] 12.1 Optimize database queries

  - Add proper includes/preload to avoid N+1 queries
  - Implement database indexes for frequently queried columns
  - Add query analysis and monitoring
  - Write performance tests for critical endpoints
  - _Requirements: 10.1, 10.3_

- [ ] 12.2 Add caching layer

  - Implement Redis caching for frequently accessed data
  - Add cache invalidation strategies
  - Cache expensive query results and computed values
  - Write tests for cache behavior and invalidation
  - _Requirements: 10.2_

- [ ] 12.3 Implement pagination and data limiting

  - Add pagination to all list endpoints
  - Implement cursor-based pagination for large datasets
  - Add configurable page size limits
  - Write tests for pagination edge cases
  - _Requirements: 10.4_

- [ ] 13. Add code quality and monitoring tools
- [ ] 13.1 Configure code quality tools

  - Set up Rubocop with custom configuration
  - Add code coverage reporting with SimpleCov
  - Configure automated code quality checks
  - Write documentation for code standards
  - _Requirements: 9.4_

- [ ] 13.2 Implement application monitoring

  - Add performance monitoring and alerting
  - Implement error tracking and reporting
  - Add health check endpoints for system monitoring
  - Configure logging and log analysis
  - _Requirements: 10.5_

- [ ] 14. Update frontend integration
- [ ] 14.1 Update API client for new endpoints

  - Modify frontend API client to handle authentication
  - Add support for new todo features (categories, tags, attachments)
  - Implement error handling for API responses
  - Update TypeScript types for new data structures
  - _Requirements: 8.2_

- [ ] 14.2 Add authentication UI components

  - Create login and registration forms
  - Implement JWT token management in frontend
  - Add protected route handling
  - Update navigation for authenticated users
  - _Requirements: 1.1, 1.2_

- [ ] 14.3 Enhance todo management UI
  - Add category and tag selection components
  - Implement file upload interface for attachments
  - Create advanced search and filter UI
  - Add comment and history viewing components
  - _Requirements: 2.3, 4.3, 5.1, 7.4_
