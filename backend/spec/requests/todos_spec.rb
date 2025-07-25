require 'rails_helper'

RSpec.describe 'Todos API', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:headers) { auth_headers_for(user) }

  describe 'GET /api/todos' do
    before do
      create_list(:todo, 3, user: user)
      create_list(:todo, 2, user: other_user)
    end

    context 'when authenticated' do
      it 'returns only current user todos' do
        get '/api/todos', headers: headers

        expect(response).to have_http_status(:ok)
        todos = JSON.parse(response.body)
        expect(todos.length).to eq(3)
        todos.each do |todo|
          expect(todo['user_id']).to eq(user.id)
        end
      end

      it 'returns todos with all required fields' do
        todo = create(:todo, 
          user: user, 
          title: 'Test Todo',
          priority: :high, 
          status: :in_progress, 
          description: 'Test description',
          due_date: Date.tomorrow
        )
        
        get '/api/todos', headers: headers

        expect(response).to have_http_status(:ok)
        todos = JSON.parse(response.body)
        todo_response = todos.find { |t| t['id'] == todo.id }
        
        expect(todo_response).to include(
          'id' => todo.id,
          'title' => 'Test Todo',
          'completed' => false,
          'priority' => 'high',
          'status' => 'in_progress',
          'description' => 'Test description',
          'due_date' => Date.tomorrow.iso8601
        )
        expect(todo_response['position']).to be_present
      end
    end

    context 'when unauthenticated' do
      it 'returns unauthorized' do
        get '/api/todos'
        
        # Unauthenticated requests return forbidden status
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'POST /api/todos' do
    let(:valid_attributes) do
      {
        title: 'New Todo',
        priority: 'high',
        status: 'pending',
        description: 'A new todo item',
        due_date: 1.week.from_now.to_date.iso8601
      }
    end

    context 'when authenticated' do
      it 'creates a new todo' do
        simple_params = { todo: { title: 'Simple Todo' } }
        
        post '/api/todos', params: simple_params, headers: headers, as: :json
        
        expect(response).to have_http_status(:created)
        todo = JSON.parse(response.body)
        expect(todo['title']).to eq('Simple Todo')
      end

      it 'assigns todo to current user' do
        simple_attributes = { title: 'User Todo Test' }
        post '/api/todos', params: { todo: simple_attributes }, headers: headers, as: :json
        
        expect(response).to have_http_status(:created)
        todo = Todo.last
        expect(todo).not_to be_nil
        expect(todo.user).to eq(user)
      end

      it 'uses default values when not provided' do
        minimal_attributes = { title: 'Minimal Todo' }
        post '/api/todos', params: { todo: minimal_attributes }, headers: headers, as: :json

        expect(response).to have_http_status(:created)
        todo = JSON.parse(response.body)
        expect(todo['priority']).to eq('medium')
        expect(todo['status']).to eq('pending')
        expect(todo['description']).to be_nil
      end

      it 'returns error for invalid attributes' do
        post '/api/todos', params: { todo: { title: '' } }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        errors = JSON.parse(response.body)
        expect(errors['errors']['title']).to include("can't be blank")
      end
    end
  end

  describe 'PUT /api/todos/:id' do
    let(:todo) { create(:todo, user: user) }
    let(:update_attributes) do
      {
        title: 'Updated Todo',
        priority: 'low',
        status: 'completed',
        description: 'Updated description'
      }
    end

    context 'when authenticated' do
      it 'updates the todo' do
        put "/api/todos/#{todo.id}", params: { todo: update_attributes }, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        todo.reload
        expect(todo.title).to eq('Updated Todo')
        expect(todo.priority).to eq('low')
        expect(todo.status).to eq('completed')
        expect(todo.description).to eq('Updated description')
      end

      it 'prevents updating other users todos' do
        other_todo = create(:todo, user: other_user)
        
        put "/api/todos/#{other_todo.id}", params: { todo: update_attributes }, headers: headers, as: :json

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'DELETE /api/todos/:id' do
    let(:todo) { create(:todo, user: user) }

    context 'when authenticated' do
      it 'deletes the todo' do
        todo_id = todo.id
        
        expect {
          delete "/api/todos/#{todo_id}", headers: headers
        }.to change(Todo, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end

      it 'prevents deleting other users todos' do
        other_todo = create(:todo, user: other_user)
        
        expect {
          delete "/api/todos/#{other_todo.id}", headers: headers
        }.not_to change(Todo, :count)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'PATCH /api/todos/update_order' do
    let!(:todo1) { create(:todo, user: user, position: 1) }
    let!(:todo2) { create(:todo, user: user, position: 2) }
    let!(:todo3) { create(:todo, user: user, position: 3) }

    context 'when authenticated' do
      it 'updates todo positions' do
        reorder_params = {
          todos: [
            { id: todo1.id, position: 3 },
            { id: todo2.id, position: 1 },
            { id: todo3.id, position: 2 }
          ]
        }

        patch '/api/todos/update_order', params: reorder_params, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        
        todo1.reload
        todo2.reload
        todo3.reload
        
        expect(todo1.position).to eq(3)
        expect(todo2.position).to eq(1)
        expect(todo3.position).to eq(2)
      end

      it 'prevents reordering other users todos' do
        other_todo = create(:todo, user: other_user, position: 1)
        
        reorder_params = {
          todos: [{ id: other_todo.id, position: 5 }]
        }

        patch '/api/todos/update_order', params: reorder_params, headers: headers, as: :json
        
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'PATCH /api/todos/:id/tags' do
    let(:todo) { create(:todo, user: user) }
    let(:tag1) { create(:tag, name: 'work', user: user) }
    let(:tag2) { create(:tag, name: 'urgent', user: user) }
    let(:tag3) { create(:tag, name: 'personal', user: user) }

    context 'when authenticated' do
      it 'updates todo tags' do
        patch "/api/todos/#{todo.id}/tags", 
              params: { tag_ids: [tag1.id, tag2.id] }, 
              headers: headers, 
              as: :json

        expect(response).to have_http_status(:ok)
        expect(todo.reload.tag_ids).to match_array([tag1.id, tag2.id])
      end

      it 'returns todo with tags in response' do
        patch "/api/todos/#{todo.id}/tags", 
              params: { tag_ids: [tag1.id] }, 
              headers: headers, 
              as: :json

        expect(JSON.parse(response.body)['tags']).to be_an(Array)
        expect(JSON.parse(response.body)['tags'].first['id']).to eq(tag1.id)
        expect(JSON.parse(response.body)['tags'].first['name']).to eq(tag1.name)
      end

      it 'replaces existing tags' do
        todo.tags << [tag1, tag2]
        
        patch "/api/todos/#{todo.id}/tags", 
              params: { tag_ids: [tag3.id] }, 
              headers: headers, 
              as: :json

        expect(todo.reload.tag_ids).to eq([tag3.id])
      end

      it 'removes all tags when empty array is provided' do
        todo.tags << [tag1, tag2]
        
        patch "/api/todos/#{todo.id}/tags", 
              params: { tag_ids: [] }, 
              headers: headers, 
              as: :json

        expect(response).to have_http_status(:ok)
        expect(todo.reload.tags).to be_empty
      end

      it 'prevents using tags from other users' do
        other_user_tag = create(:tag, user: other_user)
        
        patch "/api/todos/#{todo.id}/tags", 
              params: { tag_ids: [tag1.id, other_user_tag.id] }, 
              headers: headers, 
              as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)['error']).to eq('Invalid tag IDs')
        expect(todo.reload.tags).to be_empty
      end

      it 'prevents updating tags on other users todos' do
        other_todo = create(:todo, user: other_user)
        
        patch "/api/todos/#{other_todo.id}/tags", 
              params: { tag_ids: [tag1.id] }, 
              headers: headers, 
              as: :json

        expect(response).to have_http_status(:not_found)
      end

      it 'handles non-existent tag IDs' do
        patch "/api/todos/#{todo.id}/tags", 
              params: { tag_ids: [999999] }, 
              headers: headers, 
              as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)['error']).to eq('Invalid tag IDs')
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        patch "/api/todos/#{todo.id}/tags", 
              params: { tag_ids: [tag1.id] }, 
              as: :json

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'Todo creation and updates with tags' do
    let(:tag1) { create(:tag, name: 'work', user: user) }
    let(:tag2) { create(:tag, name: 'urgent', user: user) }

    context 'when creating a todo with tags' do
      it 'creates todo with specified tags' do
        todo_params = {
          title: 'New todo with tags',
          tag_ids: [tag1.id, tag2.id]
        }

        post '/api/todos', params: { todo: todo_params }, headers: headers, as: :json

        expect(response).to have_http_status(:created)
        created_todo = Todo.find(JSON.parse(response.body)['id'])
        expect(created_todo.tag_ids).to match_array([tag1.id, tag2.id])
      end

      it 'returns todo with tags in response' do
        todo_params = {
          title: 'New todo with tags',
          tag_ids: [tag1.id]
        }

        post '/api/todos', params: { todo: todo_params }, headers: headers, as: :json

        expect(JSON.parse(response.body)['tags']).to be_an(Array)
        expect(JSON.parse(response.body)['tags'].length).to eq(1)
        expect(JSON.parse(response.body)['tags'].first['id']).to eq(tag1.id)
      end

      it 'prevents using tags from other users during creation' do
        other_user_tag = create(:tag, user: other_user)
        todo_params = {
          title: 'New todo',
          tag_ids: [other_user_tag.id]
        }

        post '/api/todos', params: { todo: todo_params }, headers: headers, as: :json

        # The todo should be created but without invalid tags
        expect(response).to have_http_status(:created)
        created_todo = Todo.find(JSON.parse(response.body)['id'])
        expect(created_todo.tags).to be_empty
      end
    end

    context 'when updating a todo with tags' do
      let(:todo) { create(:todo, user: user) }

      it 'updates todo tags along with other attributes' do
        todo.tags << tag1

        update_params = {
          title: 'Updated title',
          tag_ids: [tag2.id]
        }

        patch "/api/todos/#{todo.id}", params: { todo: update_params }, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        todo.reload
        expect(todo.title).to eq('Updated title')
        expect(todo.tag_ids).to eq([tag2.id])
      end

      it 'preserves existing tags when tag_ids not provided' do
        todo.tags << [tag1, tag2]

        patch "/api/todos/#{todo.id}", 
              params: { todo: { title: 'Updated title' } }, 
              headers: headers, 
              as: :json

        expect(response).to have_http_status(:ok)
        expect(todo.reload.tag_ids).to match_array([tag1.id, tag2.id])
      end
    end
  end
end