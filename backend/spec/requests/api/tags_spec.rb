require 'rails_helper'

RSpec.describe "Api::V1::Tags", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }
  let(:valid_attributes) { { name: 'Work', color: '#FF0000' } }
  let(:invalid_attributes) { { name: '', color: 'invalid' } }

  describe "GET /api/tags" do
    context "when authenticated" do
      before do
        create_list(:tag, 3, user: user)
        create(:tag, user: create(:user)) # Another user's tag
      end

      it "returns all tags for the current user" do
        get '/api/v1/tags', headers: headers
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body).size).to eq(3)
      end

      it "returns tags ordered by name" do
        create(:tag, name: 'Zebra', user: user)
        create(:tag, name: 'Alpha', user: user)
        create(:tag, name: 'Beta', user: user)

        get '/api/v1/tags', headers: headers
        names = JSON.parse(response.body).map { |tag| tag['name'] }
        expect(names).to eq(names.sort)
      end

      it "does not return other users' tags" do
        get '/api/v1/tags', headers: headers
        returned_tags = JSON.parse(response.body)
        # Since user_id is not in the serializer, we need to verify by checking the count
        expect(returned_tags.size).to eq(3) # Only the user's 3 tags
      end
    end

    context "when not authenticated" do
      it "returns forbidden status" do
        get '/api/v1/tags'
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/tags/:id" do
    let(:tag) { create(:tag, user: user) }

    context "when authenticated" do
      it "returns the tag" do
        get "/api/tags/#{tag.id}", headers: headers
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['id']).to eq(tag.id)
        expect(JSON.parse(response.body)['name']).to eq(tag.name)
        expect(JSON.parse(response.body)['color']).to eq(tag.color)
      end

      it "returns 404 for non-existent tag" do
        get "/api/tags/999999", headers: headers
        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)['error']).to eq('Tag not found')
      end

      it "returns 404 for another user's tag" do
        another_tag = create(:tag, user: create(:user))
        get "/api/tags/#{another_tag.id}", headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when not authenticated" do
      it "returns forbidden status" do
        get "/api/tags/#{tag.id}"
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/tags" do
    context "when authenticated" do
      context "with valid parameters" do
        it "creates a new tag" do
          expect {
            post '/api/v1/tags', params: { tag: valid_attributes }, headers: headers, as: :json
          }.to change(Tag, :count).by(1)
        end

        it "returns the created tag" do
          post '/api/v1/tags', params: { tag: valid_attributes }, headers: headers, as: :json
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)['name']).to eq('work') # normalized
          expect(JSON.parse(response.body)['color']).to eq('#FF0000')
        end

        it "normalizes the tag name" do
          post '/api/v1/tags', params: { tag: { name: '  WORK  ' } }, headers: headers, as: :json
          expect(JSON.parse(response.body)['name']).to eq('work')
        end

        it "normalizes the color" do
          post '/api/v1/tags', params: { tag: { name: 'test', color: '#ff0000' } }, headers: headers, as: :json
          expect(JSON.parse(response.body)['color']).to eq('#FF0000')
        end
      end

      context "with invalid parameters" do
        it "does not create a new tag" do
          expect {
            post '/api/v1/tags', params: { tag: invalid_attributes }, headers: headers, as: :json
          }.not_to change(Tag, :count)
        end

        it "returns unprocessable entity status" do
          post '/api/v1/tags', params: { tag: invalid_attributes }, headers: headers, as: :json
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns validation errors" do
          post '/api/v1/tags', params: { tag: { name: '' } }, headers: headers, as: :json
          expect(JSON.parse(response.body)['errors']).to include("Name can't be blank")
        end

        it "returns error for duplicate name" do
          create(:tag, name: 'work', user: user)
          post '/api/v1/tags', params: { tag: { name: 'WORK' } }, headers: headers, as: :json
          expect(response).to have_http_status(:unprocessable_entity)
          expect(JSON.parse(response.body)['errors']).to include("Name has already been taken")
        end

        it "returns error for invalid color format" do
          post '/api/v1/tags', params: { tag: { name: 'test', color: 'red' } }, headers: headers, as: :json
          expect(JSON.parse(response.body)['errors']).to include("Color must be a valid hex color")
        end
      end
    end

    context "when not authenticated" do
      it "returns forbidden status" do
        post '/api/v1/tags', params: { tag: valid_attributes }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /api/tags/:id" do
    let(:tag) { create(:tag, name: 'old-name', color: '#000000', user: user) }
    let(:new_attributes) { { name: 'new-name', color: '#FFFFFF' } }

    context "when authenticated" do
      context "with valid parameters" do
        it "updates the tag" do
          patch "/api/tags/#{tag.id}", params: { tag: new_attributes }, headers: headers, as: :json
          tag.reload
          expect(tag.name).to eq('new-name')
          expect(tag.color).to eq('#FFFFFF')
        end

        it "returns the updated tag" do
          patch "/api/tags/#{tag.id}", params: { tag: new_attributes }, headers: headers, as: :json
          expect(response).to have_http_status(:ok)
          expect(JSON.parse(response.body)['name']).to eq('new-name')
          expect(JSON.parse(response.body)['color']).to eq('#FFFFFF')
        end
      end

      context "with invalid parameters" do
        it "returns unprocessable entity status" do
          patch "/api/tags/#{tag.id}", params: { tag: invalid_attributes }, headers: headers, as: :json
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns validation errors" do
          patch "/api/tags/#{tag.id}", params: { tag: { name: '' } }, headers: headers, as: :json
          expect(JSON.parse(response.body)['errors']).to include("Name can't be blank")
        end
      end

      it "returns 404 for non-existent tag" do
        patch "/api/tags/999999", params: { tag: new_attributes }, headers: headers, as: :json
        expect(response).to have_http_status(:not_found)
      end

      it "returns 404 for another user's tag" do
        another_tag = create(:tag, user: create(:user))
        patch "/api/tags/#{another_tag.id}", params: { tag: new_attributes }, headers: headers, as: :json
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when not authenticated" do
      it "returns forbidden status" do
        patch "/api/tags/#{tag.id}", params: { tag: new_attributes }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/tags/:id" do
    let!(:tag) { create(:tag, user: user) }

    context "when authenticated" do
      it "destroys the tag" do
        expect {
          delete "/api/tags/#{tag.id}", headers: headers
        }.to change(Tag, :count).by(-1)
      end

      it "returns no content status" do
        delete "/api/tags/#{tag.id}", headers: headers
        expect(response).to have_http_status(:no_content)
      end

      it "destroys associated todo_tags" do
        todo = create(:todo, user: user)
        create(:todo_tag, todo: todo, tag: tag)
        
        expect {
          delete "/api/tags/#{tag.id}", headers: headers
        }.to change(TodoTag, :count).by(-1)
      end

      it "returns 404 for non-existent tag" do
        delete "/api/tags/999999", headers: headers
        expect(response).to have_http_status(:not_found)
      end

      it "returns 404 for another user's tag" do
        another_tag = create(:tag, user: create(:user))
        delete "/api/tags/#{another_tag.id}", headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when not authenticated" do
      it "returns forbidden status" do
        delete "/api/tags/#{tag.id}"
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
