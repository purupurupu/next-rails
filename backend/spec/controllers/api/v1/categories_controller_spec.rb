# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::CategoriesController, type: :controller do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let!(:category) { create(:category, user: user) }
  
  describe 'authentication' do
    it 'requires authentication for all actions' do
      get :index
      expect(response).to have_http_status(:unauthorized)
      
      get :show, params: { id: 1 }
      expect(response).to have_http_status(:unauthorized)
      
      post :create, params: { category: { name: 'Test' } }
      expect(response).to have_http_status(:unauthorized)
      
      patch :update, params: { id: 1, category: { name: 'Updated' } }
      expect(response).to have_http_status(:unauthorized)
      
      delete :destroy, params: { id: 1 }
      expect(response).to have_http_status(:unauthorized)
    end
  end
  
  describe 'GET #index' do
    before { sign_in user }
    
    it 'returns categories for current user only' do
      category1 = create(:category, user: user, name: 'Work')
      category2 = create(:category, user: user, name: 'Personal')
      other_category = create(:category, user: other_user)
      
      get :index
      
      json = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(json['data'].map { |c| c['id'] }).to contain_exactly(category.id, category1.id, category2.id)
      expect(json['data'].map { |c| c['id'] }).not_to include(other_category.id)
    end
    
    it 'returns categories ordered by name' do
      category_z = create(:category, user: user, name: 'Zebra')
      category_a = create(:category, user: user, name: 'Apple')
      category_m = create(:category, user: user, name: 'Mango')
      
      get :index
      
      json = JSON.parse(response.body)
      names = json['data'].map { |c| c['name'] }
      expect(names).to eq(names.sort)
    end
    
    it 'includes proper serialized data' do
      get :index
      
      json = JSON.parse(response.body)
      expect(json['data'].first).to include(
        'id' => category.id,
        'name' => category.name,
        'color' => category.color
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
        'message' => 'Categories retrieved successfully'
      )
      expect(json).to have_key('data')
    end
  end
  
  describe 'GET #show' do
    before { sign_in user }
    
    it 'returns category when it belongs to current user' do
      get :show, params: { id: category.id }
      
      json = JSON.parse(response.body)
      expect(response).to have_http_status(:ok)
      expect(json['data']['id']).to eq(category.id)
      expect(json['data']['name']).to eq(category.name)
      expect(json['data']['color']).to eq(category.color)
    end
    
    it 'returns 404 when category belongs to another user' do
      other_category = create(:category, user: other_user)
      
      get :show, params: { id: other_category.id }
      
      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json['error']['message']).to eq('Category not found')
    end
    
    it 'returns 404 when category does not exist' do
      get :show, params: { id: 999999 }
      
      expect(response).to have_http_status(:not_found)
    end
  end
  
  describe 'POST #create' do
    before { sign_in user }
    
    context 'with valid params' do
      let(:valid_params) do
        {
          category: {
            name: 'New Category',
            color: '#FF5733'
          }
        }
      end
      
      it 'creates a new category' do
        expect {
          post :create, params: valid_params
        }.to change(Category, :count).by(1)
        
        json = JSON.parse(response.body)
        expect(response).to have_http_status(:created)
        expect(json['data']['name']).to eq('New Category')
        expect(json['data']['color']).to eq('#FF5733')
      end
      
      it 'assigns category to current user' do
        post :create, params: valid_params
        
        new_category = Category.last
        expect(new_category.user).to eq(user)
      end
      
      it 'uses default color when not provided' do
        post :create, params: { category: { name: 'No Color' } }
        
        new_category = Category.last
        expect(new_category.color).to be_present
      end
    end
    
    context 'with invalid params' do
      it 'returns error when name is missing' do
        
        expect {
          post :create, params: { category: { color: '#FF5733' } }
        }.not_to change(Category, :count)
        
        expect(response).to have_http_status(:unprocessable_entity)
      end
      
      it 'returns error when name is duplicate for same user' do
        
        existing_category = create(:category, user: user, name: 'Existing')
        
        expect {
          post :create, params: { category: { name: 'Existing' } }
        }.not_to change(Category, :count)
        
        expect(response).to have_http_status(:unprocessable_entity)
      end
      
      it 'allows duplicate names for different users' do
        other_category = create(:category, user: other_user, name: 'Shared Name')
        
        expect {
          post :create, params: { category: { name: 'Shared Name' } }
        }.to change(Category, :count).by(1)
        
        expect(response).to have_http_status(:created)
      end
    end
  end
  
  describe 'PATCH #update' do
    before { sign_in user }
    
    context 'with valid params' do
      it 'updates the category' do
        patch :update, params: {
          id: category.id,
          category: {
            name: 'Updated Name',
            color: '#00FF00'
          }
        }
        
        json = JSON.parse(response.body)
        expect(response).to have_http_status(:ok)
        expect(json['data']['name']).to eq('Updated Name')
        expect(json['data']['color']).to eq('#00FF00')
        
        category.reload
        expect(category.name).to eq('Updated Name')
        expect(category.color).to eq('#00FF00')
      end
      
      it 'allows partial updates' do
        original_color = category.color
        
        patch :update, params: {
          id: category.id,
          category: { name: 'Only Name Updated' }
        }
        
        category.reload
        expect(category.name).to eq('Only Name Updated')
        expect(category.color).to eq(original_color)
      end
    end
    
    context 'with invalid params' do
      it 'returns error for invalid data' do
        
        original_name = category.name
        
        patch :update, params: {
          id: category.id,
          category: { name: '' }
        }
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(category.reload.name).to eq(original_name)
      end
      
      it 'returns error when updating to duplicate name' do
        
        other_category = create(:category, user: user, name: 'Taken')
        original_name = category.name
        
        patch :update, params: {
          id: category.id,
          category: { name: 'Taken' }
        }
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(category.reload.name).to eq(original_name)
      end
      
      it 'returns 404 when updating other user\'s category' do
        other_category = create(:category, user: other_user)
        
        patch :update, params: {
          id: other_category.id,
          category: { name: 'Hacked!' }
        }
        
        expect(response).to have_http_status(:not_found)
      end
    end
  end
  
  describe 'DELETE #destroy' do
    before { sign_in user }
    
    it 'deletes the category' do
      expect {
        delete :destroy, params: { id: category.id }
      }.to change(Category, :count).by(-1)
      
      expect(response).to have_http_status(:no_content)
      json = JSON.parse(response.body)
      expect(json['status']['message']).to eq('Category deleted successfully')
    end
    
    it 'returns 404 when deleting other user\'s category' do
      other_category = create(:category, user: other_user)
      
      expect {
        delete :destroy, params: { id: other_category.id }
      }.not_to change(Category, :count)
      
      expect(response).to have_http_status(:not_found)
    end
    
    it 'returns 404 when category does not exist' do
      delete :destroy, params: { id: 999999 }
      
      expect(response).to have_http_status(:not_found)
    end
  end
  
  describe 'response format' do
    before { sign_in user }
    
    it 'includes proper headers' do
      get :index
      
      expect(response.headers['X-API-Version']).to eq('v1')
      expect(response.headers['Content-Type']).to match(/application\/json/)
    end
    
    it 'follows v1 response structure for success' do
      get :show, params: { id: category.id }
      
      json = JSON.parse(response.body)
      expect(json).to have_key('status')
      expect(json['status']).to include('code' => 200)
      expect(json).to have_key('data')
      expect(json).not_to have_key('error')
    end
    
    it 'follows v1 response structure for errors' do
      get :show, params: { id: 999999 }
      
      json = JSON.parse(response.body)
      expect(json).to have_key('error')
      expect(json['error']).to include(
        'code' => 'ERROR',
        'message' => 'Category not found'
      )
      expect(json['error']).to have_key('timestamp')
      expect(json).not_to have_key('status')
      expect(json).not_to have_key('data')
    end
  end
  
  describe 'serialization' do
    before { sign_in user }
    
    it 'includes todos_count in serialized data' do
      # Create some todos for this category
      create_list(:todo, 3, user: user, category: category)
      
      get :show, params: { id: category.id }
      
      json = JSON.parse(response.body)
      expect(json['data']).to include('todo_count' => 3)
    end
    
    it 'includes timestamps in serialized data' do
      get :show, params: { id: category.id }
      
      json = JSON.parse(response.body)
      expect(json['data']).to have_key('created_at')
      expect(json['data']).to have_key('updated_at')
    end
  end
end