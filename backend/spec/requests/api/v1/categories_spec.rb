require 'rails_helper'

RSpec.describe '/api/v1/categories', type: :request do
  include AuthenticationHelpers

  let(:user) { create(:user) }
  let(:other_user) { create(:user, email: 'other@example.com') }
  let(:headers) { auth_headers_for(user) }

  describe 'GET /api/v1/categories' do
    let!(:user_categories) { create_list(:category, 3, user: user) }
    let!(:other_user_category) { create(:category, user: other_user) }

    it 'returns user categories in alphabetical order' do
      get '/api/v1/categories', headers: headers

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      expect(json_response['data'].size).to eq(3)
      expect(json_response['data'].map { |c| c['name'] }).to eq(user_categories.map(&:name).sort)
    end

    it 'includes todo_count in response' do
      category = user_categories.first
      create_list(:todo, 2, user: user, category: category)

      get '/api/v1/categories', headers: headers

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      category_response = json_response['data'].find { |c| c['id'] == category.id }
      expect(category_response['todo_count']).to eq(2)
    end
  end

  describe 'GET /api/v1/categories/:id' do
    let(:category) { create(:category, user: user) }

    it 'returns the category' do
      get "/api/v1/categories/#{category.id}", headers: headers

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      expect(json_response['data']['id']).to eq(category.id)
      expect(json_response['data']['name']).to eq(category.name)
      expect(json_response['data']['color']).to eq(category.color)
    end

    context 'when category does not exist' do
      it 'returns not found' do
        get '/api/v1/categories/999', headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when category belongs to other user' do
      let(:other_category) { create(:category, user: other_user) }

      it 'returns not found' do
        get "/api/v1/categories/#{other_category.id}", headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/categories' do
    let(:valid_params) do
      {
        category: {
          name: 'New Category',
          color: '#FF5733'
        }
      }
    end

    it 'creates a new category' do
      post '/api/v1/categories', params: valid_params, headers: headers, as: :json
      
      expect(response).to have_http_status(:created)
      json_response = JSON.parse(response.body)
      
      expect(json_response['data']['name']).to eq('New Category')
      expect(json_response['data']['color']).to eq('#FF5733')
    end

    context 'with invalid params' do
      let(:invalid_params) do
        {
          category: {
            name: '',
            color: 'invalid-color'
          }
        }
      end

      it 'returns validation errors' do
        post '/api/v1/categories', params: invalid_params, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        
        expect(json_response['errors']).to be_present
        expect(json_response['errors']['name']).to include("can't be blank")
        expect(json_response['errors']['color']).to include('must be a valid hex color')
      end
    end
  end

  describe 'PATCH /api/v1/categories/:id' do
    let(:category) { create(:category, user: user, name: 'Old Name', color: '#000000') }

    let(:update_params) do
      {
        category: {
          name: 'Updated Name',
          color: '#FFFFFF'
        }
      }
    end

    it 'updates the category' do
      patch "/api/v1/categories/#{category.id}", params: update_params, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      
      expect(json_response['data']['name']).to eq('Updated Name')
      expect(json_response['data']['color']).to eq('#FFFFFF')
      
      category.reload
      expect(category.name).to eq('Updated Name')
      expect(category.color).to eq('#FFFFFF')
    end
  end

  describe 'DELETE /api/v1/categories/:id' do
    let!(:category) { create(:category, user: user) }
    let!(:todo_with_category) { create(:todo, user: user, category: category) }

    it 'deletes the category and nullifies todo categories' do
      expect {
        delete "/api/v1/categories/#{category.id}", headers: headers
      }.to change(Category, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      
      todo_with_category.reload
      expect(todo_with_category.category).to be_nil
    end
  end

  describe 'authentication' do
    it 'requires authentication for all endpoints' do
      get '/api/v1/categories'
      expect(response.status).to be_in([401, 403])

      post '/api/v1/categories', params: { category: { name: 'Test', color: '#000000' } }, as: :json
      expect(response.status).to be_in([401, 403])

      patch '/api/categories/1', params: { category: { name: 'Test' } }, as: :json
      expect(response.status).to be_in([401, 403])

      delete '/api/categories/1'
      expect(response.status).to be_in([401, 403])
    end
  end
end