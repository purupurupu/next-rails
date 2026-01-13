class TodoChangeTrackerService
  TRACKED_ATTRIBUTES = %w[title status priority due_date completed category_id description].freeze

  attr_reader :todo, :user

  def initialize(todo:, user: nil)
    @todo = todo
    @user = user || Current.user
  end

  def record_creation
    return unless user

    todo.todo_histories.create!(
      user: user,
      field_name: 'created',
      action: 'created',
      new_value: todo.title
    )
  end

  def track_update
    return {} unless user

    changes_to_track = capture_changes
    return changes_to_track if changes_to_track.empty?

    yield if block_given?

    record_changes(changes_to_track)
    changes_to_track
  end

  private

  def capture_changes
    changes = {}
    TRACKED_ATTRIBUTES.each do |attr|
      next unless todo.will_save_change_to_attribute?(attr)

      changes[attr] = {
        old_value: todo.attribute_in_database(attr),
        new_value: todo.send(attr)
      }
    end
    changes
  end

  def record_changes(changes_to_track)
    changes_to_track.each do |attr, change|
      todo.todo_histories.create!(
        user: user,
        field_name: attr,
        old_value: format_value(attr, change[:old_value]),
        new_value: format_value(attr, change[:new_value]),
        action: determine_action(attr)
      )
    end
  end

  def determine_action(attr)
    case attr
    when 'status' then 'status_changed'
    when 'priority' then 'priority_changed'
    else 'updated'
    end
  end

  def format_value(attr, value)
    case attr
    when 'category_id'
      value.present? ? Category.find_by(id: value)&.name : nil
    when 'due_date'
      value&.to_s
    else
      value.to_s
    end
  end
end
