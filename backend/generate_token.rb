#!/usr/bin/env ruby

# Create a user and generate JWT token for testing
user = User.create!(
  name: 'Test User',
  email: 'test@example.com',
  password: 'password',
  password_confirmation: 'password'
)

token = JwtService.encode(user_id: user.id)
puts "User created with ID: #{user.id}"
puts "JWT Token: #{token}"