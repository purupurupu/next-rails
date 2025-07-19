# Backend Architecture

## Technology Stack

- **Framework**: Ruby on Rails 7.1.3+ (API-only mode)
- **Language**: Ruby 3.2.5
- **Database**: PostgreSQL 15
- **Web Server**: Puma
- **Authentication**: Devise + Devise-JWT
- **Background Jobs**: Sidekiq with Redis
- **Testing**: RSpec, FactoryBot, Faker

## Key Gems

### Core
- `rails ~> 7.1.3` - Web framework
- `pg ~> 1.1` - PostgreSQL adapter
- `puma >= 5.0` - Web server
- `rack-cors` - CORS handling
- `bootsnap` - Boot time optimization

### Authentication & Security
- `devise` - Authentication solution
- `devise-jwt` - JWT token authentication

### API & Serialization
- `active_model_serializers ~> 0.10.0` - JSON serialization

### Background Processing
- `sidekiq` - Background job processing
- `redis >= 4.0.1` - In-memory data store

### Development & Testing
- `rspec-rails` - Testing framework
- `factory_bot_rails` - Test data factories
- `faker` - Fake data generation
- `shoulda-matchers` - RSpec matchers
- `database_cleaner-active_record` - Test database cleaning

## Directory Structure

```
backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── todos_controller.rb    # Todo CRUD endpoints
│   │   ├── users/
│   │   │   ├── sessions_controller.rb  # Login/logout
│   │   │   └── registrations_controller.rb # Signup
│   │   └── application_controller.rb   # Base controller
│   ├── models/
│   │   ├── user.rb                     # User model with Devise
│   │   ├── todo.rb                     # Todo model
│   │   └── jwt_denylist.rb             # JWT revocation
│   ├── serializers/
│   │   └── user_serializer.rb          # User JSON serialization
│   └── services/                       # Business logic services
├── config/
│   ├── routes.rb                       # API routes
│   ├── initializers/
│   │   ├── cors.rb                     # CORS configuration
│   │   ├── devise.rb                   # Devise settings
│   │   └── sidekiq.rb                  # Background jobs
│   └── database.yml                    # Database configuration
├── db/
│   ├── migrate/                        # Database migrations
│   └── schema.rb                       # Current schema
└── spec/                               # Test suite
    ├── models/                         # Model tests
    ├── requests/                       # API tests
    └── factories/                      # Test factories
```

## Authentication Architecture

### JWT Token Flow
```
1. User Login (POST /auth/sign_in)
   ↓
2. Validate credentials with Devise
   ↓
3. Generate JWT token
   ↓
4. Return token in response body
   ↓
5. Client stores token
   ↓
6. Client sends token in Authorization header
   ↓
7. Rails validates token on each request
```

### Token Management
- **Generation**: Warden::JWTAuth::UserEncoder
- **Storage**: Client-side (localStorage)
- **Validation**: Each API request
- **Revocation**: JWT denylist table
- **Expiration**: Configurable (default: 24 hours)

## API Design

### RESTful Endpoints
```ruby
# config/routes.rb
namespace :api do
  resources :todos do
    collection do
      patch 'update_order'  # Bulk position update
    end
  end
end
```

### Controller Pattern
```ruby
class Api::TodosController < ApplicationController
  before_action :authenticate_user!
  before_action :set_todo, only: [:show, :update, :destroy]

  def index
    @todos = current_user.todos.order(:position)
    render json: @todos
  end

  private

  def set_todo
    @todo = current_user.todos.find(params[:id])
  end

  def todo_params
    params.require(:todo).permit(:title, :completed, :due_date)
  end
end
```

## Model Architecture

### User Model
```ruby
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist
  
  has_many :todos, dependent: :destroy
  
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
end
```

### Todo Model
```ruby
class Todo < ApplicationRecord
  belongs_to :user
  
  validates :title, presence: true
  validates :due_date, comparison: { greater_than: Date.today }, 
            allow_nil: true, on: :create
  
  before_create :set_position
  
  scope :ordered, -> { order(:position) }
  scope :active, -> { where(completed: false) }
  scope :completed, -> { where(completed: true) }
end
```

## Error Handling

### Standard Error Response
```json
{
  "error": "Record not found",
  "status": 404
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

## Background Jobs

### Sidekiq Configuration
- Redis-backed job queue
- Configured for async operations
- Future use: email notifications, data cleanup

## Security Considerations

1. **Authentication**: All API endpoints require JWT token
2. **Authorization**: Users can only access their own todos
3. **CORS**: Restricted to frontend origin
4. **Parameter Filtering**: Strong parameters in controllers
5. **SQL Injection**: ActiveRecord parameterized queries

## Performance Optimizations

1. **Database Indexes**
   - User email (unique)
   - Todo position
   - Todo user_id (foreign key)
   - JWT jti (denylist lookup)

2. **Query Optimization**
   - Eager loading associations
   - Scoped queries for filtering
   - Ordered by position for consistency

3. **Caching Strategy**
   - Redis for future caching needs
   - HTTP caching headers

## Testing Strategy

### RSpec Test Suite
```ruby
# Model specs
describe Todo do
  it { should belong_to(:user) }
  it { should validate_presence_of(:title) }
end

# Request specs
describe "POST /api/todos" do
  it "creates a new todo" do
    post api_todos_path, params: { todo: attributes }
    expect(response).to have_http_status(:created)
  end
end
```

### Factory Bot
```ruby
FactoryBot.define do
  factory :todo do
    title { Faker::Lorem.sentence }
    completed { false }
    due_date { 1.week.from_now }
    user
  end
end
```