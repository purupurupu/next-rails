# Database Architecture

## Overview

- **Database System**: PostgreSQL 15
- **ORM**: ActiveRecord (Rails)
- **Migrations**: Rails migrations for schema management
- **Container**: Runs in Docker with persistent volume

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     users       │         │   jwt_denylists │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ email           │         │ jti             │
│ encrypted_pass  │         │ exp             │
│ name            │         │ created_at      │
│ created_at      │         │ updated_at      │
│ updated_at      │         └─────────────────┘
└─────────┬───────┘
          │ 1
          │
          │ *
┌─────────┴───────┐
│     todos       │
├─────────────────┤
│ id (PK)         │
│ title           │
│ completed       │
│ position        │
│ due_date        │
│ user_id (FK)    │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

## Schema Details

### users table
```sql
CREATE TABLE users (
  id bigserial PRIMARY KEY,
  email varchar DEFAULT '' NOT NULL,
  encrypted_password varchar DEFAULT '' NOT NULL,
  name varchar NOT NULL,
  reset_password_token varchar,
  reset_password_sent_at timestamp,
  remember_created_at timestamp,
  created_at timestamp(6) NOT NULL,
  updated_at timestamp(6) NOT NULL
);

CREATE UNIQUE INDEX index_users_on_email ON users(email);
CREATE UNIQUE INDEX index_users_on_reset_password_token ON users(reset_password_token);
```

**Purpose**: Stores user account information for authentication
**Key Fields**:
- `email`: Unique identifier for login
- `encrypted_password`: Bcrypt hashed password
- `name`: Display name for the user

### todos table
```sql
CREATE TABLE todos (
  id bigserial PRIMARY KEY,
  title varchar NOT NULL,
  position integer,
  completed boolean DEFAULT false,
  due_date date,
  user_id bigint NOT NULL,
  created_at timestamp(6) NOT NULL,
  updated_at timestamp(6) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX index_todos_on_position ON todos(position);
CREATE INDEX index_todos_on_user_id ON todos(user_id);
```

**Purpose**: Stores todo items for each user
**Key Fields**:
- `title`: Todo description (required)
- `position`: Order in the list (for drag-and-drop)
- `completed`: Task completion status
- `due_date`: Optional deadline
- `user_id`: Owner of the todo (foreign key)

### jwt_denylists table
```sql
CREATE TABLE jwt_denylists (
  id bigserial PRIMARY KEY,
  jti varchar NOT NULL,
  exp timestamp NOT NULL,
  created_at timestamp(6) NOT NULL,
  updated_at timestamp(6) NOT NULL
);

CREATE INDEX index_jwt_denylists_on_jti ON jwt_denylists(jti);
```

**Purpose**: Stores revoked JWT tokens for logout functionality
**Key Fields**:
- `jti`: JWT ID (unique identifier for each token)
- `exp`: Token expiration time

## Indexes

### Performance Indexes
1. **users.email** - Unique index for login lookup
2. **todos.position** - For ordering todos efficiently
3. **todos.user_id** - For filtering todos by user
4. **jwt_denylists.jti** - For checking token revocation

### Referential Integrity
- Foreign key constraint on `todos.user_id` → `users.id`
- Cascade delete: When user is deleted, all their todos are deleted

## Migrations History

```ruby
# 20240712083651_create_todos.rb
create_table :todos do |t|
  t.string :title, null: false
  t.boolean :completed, default: false
  t.timestamps
end

# 20240717132557_add_position_to_todos.rb
add_column :todos, :position, :integer
add_index :todos, :position

# 20250309140846_add_due_date_to_todos.rb
add_column :todos, :due_date, :date

# 20250717114547_devise_create_users.rb
create_table :users do |t|
  t.string :email, null: false, default: ""
  t.string :encrypted_password, null: false, default: ""
  t.string :name, null: false
  # ... devise fields
end

# 20250717114656_add_user_to_todos.rb
add_reference :todos, :user, null: false, foreign_key: true

# 20250717133141_create_jwt_denylists.rb
create_table :jwt_denylists do |t|
  t.string :jti, null: false
  t.datetime :exp, null: false
  t.timestamps
end
```

## Data Integrity Rules

### Constraints
1. **NOT NULL constraints**:
   - users.email
   - users.name
   - todos.title
   - todos.user_id
   - jwt_denylists.jti
   - jwt_denylists.exp

2. **UNIQUE constraints**:
   - users.email

3. **DEFAULT values**:
   - todos.completed = false
   - users.email = ''

### Business Rules (Enforced in Models)
1. **Todo positions**: Automatically assigned on creation
2. **Due dates**: Cannot be in the past (on creation)
3. **Email format**: Must be valid email
4. **Password**: Minimum 6 characters

## Query Patterns

### Common Queries
```sql
-- User's todos ordered by position
SELECT * FROM todos 
WHERE user_id = ? 
ORDER BY position;

-- Active todos for a user
SELECT * FROM todos 
WHERE user_id = ? AND completed = false 
ORDER BY position;

-- Check if JWT is revoked
SELECT 1 FROM jwt_denylists 
WHERE jti = ? LIMIT 1;
```

### Performance Considerations
1. **N+1 Query Prevention**: Use includes/eager loading in Rails
2. **Pagination**: Implement for large todo lists
3. **Soft Deletes**: Not implemented, using hard deletes

## Backup and Recovery

### Docker Volume
- Data persisted in `postgres_data` volume
- Survives container restarts
- Manual backup: `docker compose exec db pg_dump`

### Development Seeds
```ruby
# db/seeds.rb
user = User.create!(
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
)

10.times do |i|
  user.todos.create!(
    title: "Todo #{i + 1}",
    position: i,
    completed: [true, false].sample,
    due_date: rand(1..30).days.from_now
  )
end
```

## Future Considerations

1. **Soft Deletes**: Add `deleted_at` for recoverable todos
2. **Audit Trail**: Track changes to todos
3. **Full-Text Search**: PostgreSQL FTS for todo search
4. **Archiving**: Move old completed todos to archive table
5. **Multi-tenancy**: If scaling to organizations/teams