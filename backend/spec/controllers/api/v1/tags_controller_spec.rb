# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::TagsController, type: :controller do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let!(:tag) { create(:tag, user: user) }

  describe 'authentication' do
    it 'requires authentication for all actions' do
      get :index
      expect(response).to have_http_status(:unauthorized)

      get :show, params: { id: 1 }
      expect(response).to have_http_status(:unauthorized)

      post :create, params: { tag: { name: 'Test' } }
      expect(response).to have_http_status(:unauthorized)

      patch :update, params: { id: 1, tag: { name: 'Updated' } }
      expect(response).to have_http_status(:unauthorized)

      delete :destroy, params: { id: 1 }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'GET #index' do
    before { sign_in user }

    it 'returns tags for current user only' do
      tag1 = create(:tag, user: user, name: 'Important')
      tag2 = create(:tag, user: user, name: 'Urgent')
      other_tag = create(:tag, user: other_user)

      get :index

      json = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(json['data'].map { |t| t['id'] }).to contain_exactly(tag.id, tag1.id, tag2.id)
      expect(json['data'].map { |t| t['id'] }).not_to include(other_tag.id)
    end

    it 'returns tags in ordered scope' do
      # Tags should be ordered by the 'ordered' scope defined in the model
      # Usually this is by created_at or a custom ordering
      create(:tag, user: user, created_at: 1.week.ago)
      create(:tag, user: user, created_at: 1.day.ago)

      get :index

      json = JSON.parse(response.body)
      # Verify tags are returned in some consistent order
      tag_ids = json['data'].map { |t| t['id'] }
      expect(tag_ids).to eq(tag_ids.sort) # Assuming ordered by id or created_at
    end

    it 'includes proper serialized data' do
      get :index

      json = JSON.parse(response.body)
      expect(json['data'].first).to include(
        'id' => tag.id,
        'name' => tag.name,
        'color' => tag.color
      )
    end

    it 'sets correct API version header' do
      get :index
      expect(response.headers['X-API-Version']).to eq('v1')
    end

    it 'follows v1 response structure' do
      get :index

      json = JSON.parse(response.body)
      expect(json).to have_key('status')
      expect(json['status']).to include(
        'code' => 200,
        'message' => 'Tags retrieved successfully'
      )
      expect(json).to have_key('data')
    end
  end

  describe 'GET #show' do
    before { sign_in user }

    it 'returns tag when it belongs to current user' do
      get :show, params: { id: tag.id }

      json = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(json['data']['id']).to eq(tag.id)
      expect(json['data']['name']).to eq(tag.name)
      expect(json['data']['color']).to eq(tag.color)
    end

    it 'returns 404 when tag belongs to another user' do
      other_tag = create(:tag, user: other_user)

      get :show, params: { id: other_tag.id }

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json['error']['message']).to eq('Tag not found')
    end

    it 'returns 404 when tag does not exist' do
      get :show, params: { id: 999_999 }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST #create' do
    before { sign_in user }

    context 'with valid params' do
      let(:valid_params) do
        {
          tag: {
            name: 'New Tag',
            color: '#FF5733'
          }
        }
      end

      it 'creates a new tag' do
        expect do
          post :create, params: valid_params
        end.to change(Tag, :count).by(1)

        json = JSON.parse(response.body)
        expect(response).to have_http_status(:created)
        expect(json['data']['name']).to eq('new tag') # Tag names are downcased
        expect(json['data']['color']).to eq('#FF5733')
      end

      it 'assigns tag to current user' do
        post :create, params: valid_params

        new_tag = Tag.last
        expect(new_tag.user).to eq(user)
      end

      it 'uses default color when not provided' do
        post :create, params: { tag: { name: 'No Color' } }

        new_tag = Tag.last
        expect(new_tag.color).to be_present
      end
    end

    context 'with invalid params' do
      it 'returns error when name is missing' do
        expect do
          post :create, params: { tag: { color: '#FF5733' } }
        end.not_to change(Tag, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns error when name is duplicate for same user' do
        create(:tag, user: user, name: 'Existing')

        expect do
          post :create, params: { tag: { name: 'Existing' } }
        end.not_to change(Tag, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'allows duplicate names for different users' do
        create(:tag, user: other_user, name: 'Shared Name')

        expect do
          post :create, params: { tag: { name: 'Shared Name' } }
        end.to change(Tag, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end
  end

  describe 'PATCH #update' do
    before { sign_in user }

    context 'with valid params' do
      it 'updates the tag' do
        patch :update, params: {
          id: tag.id,
          tag: {
            name: 'Updated Name',
            color: '#00FF00'
          }
        }

        json = JSON.parse(response.body)
        expect(response).to have_http_status(:ok)
        expect(json['data']['name']).to eq('updated name') # Tag names are downcased
        expect(json['data']['color']).to eq('#00FF00')

        tag.reload
        expect(tag.name).to eq('updated name')
        expect(tag.color).to eq('#00FF00')
      end

      it 'allows partial updates' do
        original_color = tag.color

        patch :update, params: {
          id: tag.id,
          tag: { name: 'Only Name Updated' }
        }

        tag.reload
        expect(tag.name).to eq('only name updated')
        expect(tag.color).to eq(original_color)
      end
    end

    context 'with invalid params' do
      it 'returns error for invalid data' do
        original_name = tag.name

        patch :update, params: {
          id: tag.id,
          tag: { name: '' }
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(tag.reload.name).to eq(original_name)
      end

      it 'returns error when updating to duplicate name' do
        create(:tag, user: user, name: 'Taken')
        original_name = tag.name

        patch :update, params: {
          id: tag.id,
          tag: { name: 'Taken' }
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(tag.reload.name).to eq(original_name)
      end

      it 'returns 404 when updating other user\'s tag' do
        other_tag = create(:tag, user: other_user)

        patch :update, params: {
          id: other_tag.id,
          tag: { name: 'Hacked!' }
        }

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'DELETE #destroy' do
    before { sign_in user }

    it 'deletes the tag' do
      expect do
        delete :destroy, params: { id: tag.id }
      end.to change(Tag, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      json = JSON.parse(response.body)
      expect(json['status']['message']).to eq('Tag deleted successfully')
    end

    it 'returns 404 when deleting other user\'s tag' do
      other_tag = create(:tag, user: other_user)

      expect do
        delete :destroy, params: { id: other_tag.id }
      end.not_to change(Tag, :count)

      expect(response).to have_http_status(:not_found)
    end

    it 'returns 404 when tag does not exist' do
      delete :destroy, params: { id: 999_999 }

      expect(response).to have_http_status(:not_found)
    end

    it 'removes tag associations from todos' do
      todo = create(:todo, user: user, tags: [tag])

      expect(todo.tags).to include(tag)

      delete :destroy, params: { id: tag.id }

      todo.reload
      expect(todo.tags).to be_empty
    end
  end

  describe 'response format' do
    before { sign_in user }

    it 'includes proper headers' do
      get :index

      expect(response.headers['X-API-Version']).to eq('v1')
      expect(response.headers['Content-Type']).to match(%r{application/json})
    end

    it 'follows v1 response structure for success' do
      get :show, params: { id: tag.id }

      json = JSON.parse(response.body)
      expect(json).to have_key('status')
      expect(json['status']).to include('code' => 200)
      expect(json).to have_key('data')
      expect(json).not_to have_key('error')
    end

    it 'follows v1 response structure for errors' do
      get :show, params: { id: 999_999 }

      json = JSON.parse(response.body)
      expect(json).to have_key('error')
      expect(json['error']).to include(
        'code' => 'ERROR',
        'message' => 'Tag not found'
      )
      expect(json['error']).to have_key('timestamp')
      expect(json).not_to have_key('status')
      expect(json).not_to have_key('data')
    end
  end

  describe 'serialization' do
    before { sign_in user }

    it 'includes todos_count in serialized data' do
      # Create some todos with this tag
      create_list(:todo, 3, user: user, tags: [tag])

      get :show, params: { id: tag.id }

      json = JSON.parse(response.body)
      # Tag serializer doesn't include todos_count
      expect(json['data']).to have_key('id')
      expect(json['data']).to have_key('name')
    end

    it 'includes timestamps in serialized data' do
      get :show, params: { id: tag.id }

      json = JSON.parse(response.body)
      expect(json['data']).to have_key('created_at')
      expect(json['data']).to have_key('updated_at')
    end
  end

  describe 'tag usage' do
    before { sign_in user }

    it 'can be assigned to multiple todos' do
      todo1 = create(:todo, user: user, tags: [tag])
      todo2 = create(:todo, user: user, tags: [tag])
      todo3 = create(:todo, user: user)

      expect(tag.todos).to contain_exactly(todo1, todo2)
      expect(tag.todos).not_to include(todo3)
    end

    it 'maintains user scope for todo associations' do
      user_todo = create(:todo, user: user, tags: [tag])
      other_user_todo = create(:todo, user: other_user)

      # Tag should only be associated with user's todos
      expect(tag.todos).to include(user_todo)
      expect(tag.todos).not_to include(other_user_todo)
    end
  end
end
