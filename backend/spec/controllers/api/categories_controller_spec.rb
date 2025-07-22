require 'rails_helper'

RSpec.describe Api::CategoriesController, type: :controller do
  include AuthenticationHelpers

  let(:user) { create(:user) }
  let(:other_user) { create(:user, email: 'other@example.com') }

  before do
    sign_in_user(user)
  end

  describe 'GET #index' do
    let!(:user_category) { create(:category, user: user) }
    let!(:other_user_category) { create(:category, user: other_user) }

    it 'returns user categories only' do
      get :index
      expect(response).to have_http_status(:ok)
      
      json_response = JSON.parse(response.body)
      expect(json_response.size).to eq(1)
      expect(json_response.first['name']).to eq(user_category.name)
    end
  end

  describe 'GET #show' do
    let!(:category) { create(:category, user: user) }

    context 'when category belongs to current user' do
      it 'returns the category' do
        get :show, params: { id: category.id }
        expect(response).to have_http_status(:ok)
        
        json_response = JSON.parse(response.body)
        expect(json_response['name']).to eq(category.name)
      end
    end

    context 'when category belongs to other user' do
      let!(:other_category) { create(:category, user: other_user) }

      it 'returns not found' do
        get :show, params: { id: other_category.id }
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST #create' do
    let(:valid_params) do
      {
        category: {
          name: 'Work',
          color: '#FF0000'
        }
      }
    end

    context 'with valid parameters' do
      it 'creates a new category' do
        expect {
          post :create, params: valid_params
        }.to change(Category, :count).by(1)

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)
        expect(json_response['name']).to eq('Work')
        expect(json_response['color']).to eq('#FF0000')
      end
    end

    context 'with invalid parameters' do
      let(:invalid_params) do
        {
          category: {
            name: '',
            color: 'invalid'
          }
        }
      end

      it 'does not create a category' do
        expect {
          post :create, params: invalid_params
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'with duplicate name' do
      let!(:existing_category) { create(:category, user: user, name: 'Work') }
      
      it 'does not create a category' do
        expect {
          post :create, params: valid_params
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'PATCH #update' do
    let!(:category) { create(:category, user: user, name: 'Old Name') }

    context 'with valid parameters' do
      let(:update_params) do
        {
          id: category.id,
          category: {
            name: 'New Name',
            color: '#00FF00'
          }
        }
      end

      it 'updates the category' do
        patch :update, params: update_params
        expect(response).to have_http_status(:ok)
        
        category.reload
        expect(category.name).to eq('New Name')
        expect(category.color).to eq('#00FF00')
      end
    end

    context 'when category belongs to other user' do
      let!(:other_category) { create(:category, user: other_user) }
      
      it 'returns not found' do
        patch :update, params: { 
          id: other_category.id, 
          category: { name: 'New Name' } 
        }
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'DELETE #destroy' do
    let!(:category) { create(:category, user: user) }

    context 'when category belongs to current user' do
      it 'deletes the category' do
        expect {
          delete :destroy, params: { id: category.id }
        }.to change(Category, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end

    context 'when category belongs to other user' do
      let!(:other_category) { create(:category, user: other_user) }

      it 'returns not found' do
        expect {
          delete :destroy, params: { id: other_category.id }
        }.not_to change(Category, :count)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end