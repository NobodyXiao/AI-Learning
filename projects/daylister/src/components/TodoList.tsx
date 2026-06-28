import React, { useState } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Tag,
  Checkbox,
  Typography,
  Space,
  Row,
  Col,
  Empty,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  FireOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

type Priority = 'high' | 'medium' | 'low';
type FilterStatus = 'all' | 'active' | 'completed';

interface Todo {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  high: { color: 'red', label: 'High' },
  medium: { color: 'orange', label: 'Medium' },
  low: { color: 'green', label: 'Low' },
};

const priorityOptions: Priority[] = ['high', 'medium', 'low'];

let nextId = 1;

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const addTodo = () => {
    if (!title.trim()) return;
    const todo: Todo = {
      id: nextId++,
      title: title.trim(),
      description: description.trim(),
      priority,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [todo, ...prev]);
    setTitle('');
    setDescription('');
    setPriority('medium');
  };

  const deleteTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleComplete = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const changePriority = (id: number, newPriority: Priority) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: newPriority } : t))
    );
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;

  const filteredIds = filteredTodos.map((t) => t.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const indeterminate = !allSelected && filteredIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const deleteSelected = () => {
    setTodos((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  const toggleSelectedComplete = () => {
    const allFilteredDone = filteredTodos
      .filter((t) => selectedIds.has(t.id))
      .every((t) => t.completed);
    setTodos((prev) =>
      prev.map((t) =>
        selectedIds.has(t.id) ? { ...t, completed: !allFilteredDone } : t
      )
    );
    setSelectedIds(new Set());
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        <FireOutlined /> Todo List
      </Title>

      {/* Add Task Card */}
      <Card style={{ marginBottom: 24 }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={addTodo}
            size="large"
          />
          <TextArea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Row gutter={12} align="middle">
            <Col flex="auto">
              <Select
                value={priority}
                onChange={setPriority}
                style={{ width: 140 }}
                options={priorityOptions.map((p) => ({
                  value: p,
                  label: (
                    <Tag color={priorityConfig[p].color} style={{ margin: 0 }}>
                      {priorityConfig[p].label}
                    </Tag>
                  ),
                }))}
              />
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addTodo}
                size="large"
              >
                Add Task
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Filter & Stats */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            {(['all', 'active', 'completed'] as FilterStatus[]).map((f) => (
              <Button
                key={f}
                type={filter === f ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </Space>
        </Col>
        <Col>
          <Text type="secondary">
            {todos.length} total · {activeCount} active
          </Text>
        </Col>
      </Row>

      {/* Select All & Batch Actions */}
      {todos.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            padding: '4px 8px',
            background: selectedIds.size > 0 ? '#e6f4ff' : 'transparent',
            borderRadius: 6,
            transition: 'background 0.2s',
          }}
        >
          <Space>
            <Checkbox
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={toggleSelectAll}
            >
              Select all
            </Checkbox>
            {selectedIds.size > 0 && (
              <Text type="secondary">{selectedIds.size} selected</Text>
            )}
          </Space>
          {selectedIds.size > 0 && (
            <Space>
              <Button
                size="small"
                onClick={toggleSelectedComplete}
              >
                {filteredTodos
                  .filter((t) => selectedIds.has(t.id))
                  .every((t) => t.completed)
                  ? 'Mark active'
                  : 'Mark done'}
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={deleteSelected}
              >
                Delete
              </Button>
            </Space>
          )}
        </div>
      )}

      {/* Task List */}
      <Card>
        {filteredTodos.length === 0 ? (
          <Empty
            description={
              todos.length === 0 ? 'No tasks yet. Add one above!' : 'No matching tasks'
            }
          />
        ) : (
          <div>
            {filteredTodos.map((todo, index) => (
              <div key={todo.id}>
                {index > 0 && <Divider style={{ margin: '8px 0' }} />}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '8px 0',
                  }}
                >
                  <Checkbox
                    checked={todo.completed}
                    onChange={() => toggleComplete(todo.id)}
                    style={{ marginTop: 4 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text
                        delete={todo.completed}
                        strong
                        style={{
                          color: todo.completed ? '#999' : undefined,
                        }}
                      >
                        {todo.title}
                      </Text>
                      <Tag color={priorityConfig[todo.priority].color}>
                        {priorityConfig[todo.priority].label}
                      </Tag>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {todo.description ? (
                        <Text type="secondary">{todo.description}</Text>
                      ) : (
                        <Text type="secondary" italic>
                          No description
                        </Text>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <Select
                      value={todo.priority}
                      size="small"
                      style={{ width: 100 }}
                      onChange={(val) => changePriority(todo.id, val)}
                      options={priorityOptions.map((p) => ({
                        value: p,
                        label: (
                          <Tag color={priorityConfig[p].color} style={{ margin: 0 }}>
                            {priorityConfig[p].label}
                          </Tag>
                        ),
                      }))}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteTodo(todo.id)}
                      aria-label={`Delete ${todo.title}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TodoList;
