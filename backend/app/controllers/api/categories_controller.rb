class Api::CategoriesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_category, only: [:show, :update, :destroy]

  # GET /api/categories
  def index
    @categories = current_user.categories.order(:name)
    render json: @categories, each_serializer: CategorySerializer
  end

  # GET /api/categories/:id
  def show
    render json: @category, serializer: CategorySerializer
  end

  # POST /api/categories
  def create
    @category = current_user.categories.build(category_params)

    if @category.save
      render json: @category, serializer: CategorySerializer, status: :created
    else
      render json: { errors: @category.errors }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/categories/:id
  def update
    if @category.update(category_params)
      render json: @category, serializer: CategorySerializer
    else
      render json: { errors: @category.errors }, status: :unprocessable_entity
    end
  end

  # DELETE /api/categories/:id
  def destroy
    @category.destroy
    head :no_content
  end

  private

  def set_category
    @category = current_user.categories.find(params[:id])
  end

  def category_params
    params.require(:category).permit(:name, :color)
  end
end