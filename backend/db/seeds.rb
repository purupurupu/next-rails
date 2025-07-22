# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "🌱 Starting seed process..."

# Clear existing data in development environment only
if Rails.env.development?
  puts "🧹 Cleaning up existing data..."
  Todo.destroy_all
  Category.destroy_all
  User.destroy_all
end

# Create sample users
puts "👥 Creating users..."

demo_user = User.find_or_create_by!(email: 'demo@example.com') do |user|
  user.name = 'デモユーザー'
  user.password = 'password123'
  user.password_confirmation = 'password123'
end

john_user = User.find_or_create_by!(email: 'john@example.com') do |user|
  user.name = 'John Doe'
  user.password = 'password123'
  user.password_confirmation = 'password123'
end

alice_user = User.find_or_create_by!(email: 'alice@example.com') do |user|
  user.name = 'Alice Smith'
  user.password = 'password123'  
  user.password_confirmation = 'password123'
end

puts "✅ Created #{User.count} users"

# Create categories for each user
puts "📂 Creating categories..."

# Demo user categories (Japanese)
demo_categories = [
  { name: '仕事', color: '#3B82F6', user: demo_user },
  { name: '個人', color: '#10B981', user: demo_user },
  { name: '学習', color: '#F59E0B', user: demo_user },
  { name: '買い物', color: '#EF4444', user: demo_user },
  { name: '健康', color: '#8B5CF6', user: demo_user }
]

# John user categories
john_categories = [
  { name: 'Work', color: '#1E40AF', user: john_user },
  { name: 'Personal', color: '#059669', user: john_user },
  { name: 'Projects', color: '#DC2626', user: john_user },
  { name: 'Learning', color: '#7C2D12', user: john_user }
]

# Alice user categories  
alice_categories = [
  { name: 'Design', color: '#DB2777', user: alice_user },
  { name: 'Meetings', color: '#2563EB', user: alice_user },
  { name: 'Creative', color: '#7C3AED', user: alice_user },
  { name: 'Admin', color: '#374151', user: alice_user }
]

all_categories = demo_categories + john_categories + alice_categories

created_categories = {}
all_categories.each do |cat_data|
  category = Category.find_or_create_by!(
    name: cat_data[:name], 
    user: cat_data[:user]
  ) do |cat|
    cat.color = cat_data[:color]
  end
  created_categories["#{cat_data[:user].email}_#{cat_data[:name]}"] = category
end

puts "✅ Created #{Category.count} categories"

# Create todos for each user
puts "📝 Creating todos..."

# Demo user todos (Japanese)
demo_todos = [
  # 仕事カテゴリ
  { title: 'プロジェクト企画書を作成', description: 'Q1のプロジェクト企画書を作成し、上司に提出する', category_key: 'demo@example.com_仕事', priority: :high, status: :in_progress, due_date: 3.days.from_now },
  { title: '会議資料の準備', description: '来週の部署会議で使用する資料を準備', category_key: 'demo@example.com_仕事', priority: :medium, status: :pending, due_date: 5.days.from_now },
  { title: 'メールの返信', description: '溜まっているメールに返信する', category_key: 'demo@example.com_仕事', priority: :low, status: :pending },
  
  # 個人カテゴリ
  { title: '家族との時間', description: '週末に家族と映画を見る', category_key: 'demo@example.com_個人', priority: :medium, status: :pending, due_date: 2.days.from_now },
  { title: '読書タイム', description: '新しく買った本を読み進める', category_key: 'demo@example.com_個人', priority: :low, status: :completed },
  { title: '部屋の掃除', description: 'リビングと寝室を掃除する', category_key: 'demo@example.com_個人', priority: :medium, status: :in_progress },
  
  # 学習カテゴリ
  { title: 'Ruby on Rails学習', description: 'Rails 7の新機能について学習する', category_key: 'demo@example.com_学習', priority: :high, status: :in_progress, due_date: 1.week.from_now },
  { title: 'JavaScript復習', description: 'ES6以降の機能を復習する', category_key: 'demo@example.com_学習', priority: :medium, status: :pending },
  
  # 買い物カテゴリ
  { title: '日用品の買い出し', description: 'シャンプー、洗剤、トイレットペーパーを買う', category_key: 'demo@example.com_買い物', priority: :high, status: :pending, due_date: 1.day.from_now },
  { title: 'プレゼント選び', description: '友人の誕生日プレゼントを選ぶ', category_key: 'demo@example.com_買い物', priority: :medium, status: :pending },
  
  # 健康カテゴリ
  { title: '定期健康診断', description: '年1回の健康診断を受ける', category_key: 'demo@example.com_健康', priority: :high, status: :pending, due_date: 2.weeks.from_now },
  { title: 'ジョギング', description: '週3回のジョギング習慣を続ける', category_key: 'demo@example.com_健康', priority: :medium, status: :in_progress },
  
  # カテゴリなし
  { title: '銀行の手続き', description: '口座の住所変更手続きをする', priority: :medium, status: :pending }
]

# John user todos
john_todos = [
  # Work category
  { title: 'Complete project proposal', description: 'Finalize the Q1 project proposal for client review', category_key: 'john@example.com_Work', priority: :high, status: :in_progress, due_date: 2.days.from_now },
  { title: 'Team standup meeting', description: 'Daily standup with development team', category_key: 'john@example.com_Work', priority: :medium, status: :completed },
  { title: 'Code review', description: 'Review pull requests from junior developers', category_key: 'john@example.com_Work', priority: :high, status: :pending, due_date: 1.day.from_now },
  
  # Personal category
  { title: 'Plan weekend trip', description: 'Research and book accommodations for weekend getaway', category_key: 'john@example.com_Personal', priority: :low, status: :pending },
  { title: 'Call parents', description: 'Weekly check-in call with parents', category_key: 'john@example.com_Personal', priority: :medium, status: :pending, due_date: 3.days.from_now },
  
  # Projects category
  { title: 'Update portfolio website', description: 'Add recent projects and update design', category_key: 'john@example.com_Projects', priority: :medium, status: :in_progress },
  { title: 'Open source contribution', description: 'Contribute to React documentation', category_key: 'john@example.com_Projects', priority: :low, status: :pending },
  
  # Learning category
  { title: 'Docker workshop', description: 'Complete advanced Docker containerization course', category_key: 'john@example.com_Learning', priority: :high, status: :in_progress, due_date: 1.week.from_now },
  { title: 'GraphQL tutorial', description: 'Learn GraphQL fundamentals and best practices', category_key: 'john@example.com_Learning', priority: :medium, status: :pending }
]

# Alice user todos
alice_todos = [
  # Design category
  { title: 'UI mockups for mobile app', description: 'Create high-fidelity mockups for the new mobile application', category_key: 'alice@example.com_Design', priority: :high, status: :in_progress, due_date: 4.days.from_now },
  { title: 'Brand guidelines update', description: 'Update company brand guidelines with new logo variations', category_key: 'alice@example.com_Design', priority: :medium, status: :pending },
  { title: 'Icon set creation', description: 'Design custom icon set for dashboard interface', category_key: 'alice@example.com_Design', priority: :low, status: :completed },
  
  # Meetings category
  { title: 'Client presentation', description: 'Present design concepts to key stakeholders', category_key: 'alice@example.com_Meetings', priority: :high, status: :pending, due_date: 1.day.from_now },
  { title: 'Design team sync', description: 'Weekly sync with design team members', category_key: 'alice@example.com_Meetings', priority: :medium, status: :completed },
  
  # Creative category
  { title: 'Inspiration research', description: 'Gather inspiration for upcoming campaign designs', category_key: 'alice@example.com_Creative', priority: :low, status: :in_progress },
  { title: 'Photography session', description: 'Plan and execute product photography session', category_key: 'alice@example.com_Creative', priority: :medium, status: :pending, due_date: 5.days.from_now },
  
  # Admin category
  { title: 'Expense reports', description: 'Submit monthly expense reports to finance', category_key: 'alice@example.com_Admin', priority: :high, status: :pending, due_date: 2.days.from_now },
  { title: 'Software license renewal', description: 'Renew Adobe Creative Suite license', category_key: 'alice@example.com_Admin', priority: :medium, status: :completed }
]

all_todos = demo_todos + john_todos + alice_todos

# Assign users to todos
all_todos.each_with_index do |todo_data, index|
  user = if todo_data.key?(:category_key) && todo_data[:category_key]
    email = todo_data[:category_key].split('_').first
    User.find_by(email: email)
  else
    demo_user  # Default to demo user for todos without categories
  end
  
  todo_params = {
    title: todo_data[:title],
    description: todo_data[:description],
    priority: todo_data[:priority] || :medium,
    status: todo_data[:status] || :pending,
    due_date: todo_data[:due_date],
    completed: todo_data[:status] == :completed,
    user: user,
    position: index + 1
  }
  
  # Add category if specified
  if todo_data[:category_key] && created_categories[todo_data[:category_key]]
    todo_params[:category] = created_categories[todo_data[:category_key]]
  end
  
  Todo.create!(todo_params)
end

puts "✅ Created #{Todo.count} todos"

# Print summary
puts "\n🎉 Seed completed successfully!"
puts "📊 Summary:"
puts "  Users: #{User.count}"
puts "  Categories: #{Category.count}"  
puts "  Todos: #{Todo.count}"
puts "    - Completed: #{Todo.completed.count}"
puts "    - In Progress: #{Todo.in_progress.count}"
puts "    - Pending: #{Todo.pending.count}"
puts "    - With Categories: #{Todo.joins(:category).count}"
puts "    - Without Categories: #{Todo.left_joins(:category).where(category: nil).count}"

puts "\n👤 Sample login credentials:"
puts "  Email: demo@example.com"
puts "  Email: john@example.com"  
puts "  Email: alice@example.com"
puts "  Password: password123"

puts "\n🌱 Seed process completed!"