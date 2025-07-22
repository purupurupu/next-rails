# Categories API

カテゴリー管理のためのRESTful APIエンドポイント。すべてのエンドポイントはJWT認証が必要で、ユーザーは自分のカテゴリーのみにアクセス可能です。

## Base URL

```
http://localhost:3001/api/categories
```

## 認証

すべてのリクエストにはAuthorizationヘッダーが必要です：

```
Authorization: Bearer <jwt_token>
```

## エンドポイント

### GET /api/categories

ユーザーのカテゴリー一覧を取得します。

**Request:**
```http
GET /api/categories
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "仕事",
      "color": "#3B82F6",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "個人",
      "color": "#10B981",
      "created_at": "2024-01-15T10:31:00Z",
      "updated_at": "2024-01-15T10:31:00Z"
    }
  ]
}
```

### GET /api/categories/:id

特定のカテゴリーを取得します。

**Request:**
```http
GET /api/categories/1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "category": {
    "id": 1,
    "name": "仕事",
    "color": "#3B82F6",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### POST /api/categories

新しいカテゴリーを作成します。

**Request:**
```http
POST /api/categories
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "category": {
    "name": "学習",
    "color": "#F59E0B"
  }
}
```

**Response:**
```json
{
  "category": {
    "id": 3,
    "name": "学習",
    "color": "#F59E0B",
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

### PUT /api/categories/:id

既存のカテゴリーを更新します。

**Request:**
```http
PUT /api/categories/1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "category": {
    "name": "プロジェクト管理",
    "color": "#1E40AF"
  }
}
```

**Response:**
```json
{
  "category": {
    "id": 1,
    "name": "プロジェクト管理",
    "color": "#1E40AF",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:05:00Z"
  }
}
```

### DELETE /api/categories/:id

カテゴリーを削除します。関連するTodoのcategory_idはnullに設定されます。

**Request:**
```http
DELETE /api/categories/1
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

## エラーレスポンス

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["can't be blank"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Category not found"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["has already been taken"]
  }
}
```

## バリデーション

### Category Model

- **name**: 必須、1-50文字、ユーザー内でユニーク
- **color**: 必須、有効なHEXカラーコード形式（#RRGGBB）
- **user_id**: 自動設定（現在のユーザー）

## 使用例

### カテゴリー付きTodo作成の流れ

1. カテゴリー一覧を取得
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/categories
```

2. 新しいカテゴリーを作成（必要に応じて）
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"category":{"name":"買い物","color":"#EF4444"}}' \
     http://localhost:3001/api/categories
```

3. カテゴリー付きTodoを作成
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"todo":{"title":"食材を買う","category_id":3}}' \
     http://localhost:3001/api/todos
```