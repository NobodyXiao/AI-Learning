# React Code Review Guide

## 目录

1. [组件规范](#1-组件规范)
2. [Hooks 规范](#2-hooks-规范)
3. [TypeScript 规范](#3-typescript-规范)
4. [性能优化](#4-性能优化)
5. [样式规范](#5-样式规范)
6. [状态管理](#6-状态管理)
7. [测试规范](#7-测试规范)
8. [安全规范](#8-安全规范)
9. [可访问性](#9-可访问性)

---

## 1. 组件规范

### 1.1 组件结构

```tsx
// ✅ Good: 清晰的结构
import React, { useState, useCallback } from 'react';
import styles from './TodoItem.module.css';

interface TodoItemProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  id,
  title,
  completed,
  onToggle,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleToggle = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);

  return (
    <div className={styles.item}>
      <input type="checkbox" checked={completed} onChange={handleToggle} />
      <span>{title}</span>
      <button onClick={() => onDelete(id)}>删除</button>
    </div>
  );
};
```

### 1.2 组件原则

- **单一职责**: 每个组件只做一件事
- **避免过大组件**: 超过 200 行考虑拆分
- **命名即文档**: 组件名、prop 名应当自描述
- **Props 不可变**: 永远不要修改 props
- **使用 interface 定义 Props**, 不要用 inline 类型

### 1.3 组件导出

```tsx
// ✅ Good: 命名导出
export const TodoList = () => { ... };

// ❌ Bad: 默认导出 (不利于 tree-shaking 和重构)
export default TodoList;
```

### 1.4 条件渲染

```tsx
// ✅ Good
{isLoading && <Spinner />}
{items.length > 0 ? (
  <ItemList items={items} />
) : (
  <EmptyState />
)}

// ❌ Bad: 三元表达式嵌套过深
{condition ? (a ? <A /> : <B />) : <C />}
```

---

## 2. Hooks 规范

### 2.1 Hooks 规则

```tsx
// ✅ Good: hooks 在顶层调用
const App = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  // ...
};

// ❌ Bad: 条件中调用 hooks
if (condition) {
  useEffect(() => { ... });
}
```

### 2.2 useEffect 依赖管理

```tsx
// ✅ Good: 完整依赖数组
useEffect(() => {
  fetchData(filters).then(setData);
}, [filters]);

// ❌ Bad: 缺少依赖或使用 lint-disable
useEffect(() => {
  fetchData(filters).then(setData);
  // eslint-disable-next-line
}, []);
```

### 2.3 自定义 Hooks

```tsx
// ✅ Good: 封装复用逻辑
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### 2.4 useMemo / useCallback

```tsx
// ✅ Good: 计算代价大时使用 useMemo
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// ✅ Good: 作为 props 传给子组件时使用 useCallback
const handleClick = useCallback(() => {
  setCount((c) => c + 1);
}, []);

// ❌ Bad: 不需要的 memoization
const name = useMemo(() => `${user.first} ${user.last}`, [user]);
```

---

## 3. TypeScript 规范

### 3.1 Props 类型

```tsx
// ✅ Good: 清晰的 interface 定义
interface ButtonProps {
  /** 按钮文本 */
  label: string;
  /** 点击回调 */
  onClick: () => void;
  /** 变体 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 是否禁用 */
  disabled?: boolean;
  children?: React.ReactNode;
}

// ❌ Bad: 松散的类型
interface ButtonProps {
  [key: string]: any;
}
```

### 3.2 避免 any

```tsx
// ✅ Good
const fetchData = async (): Promise<Data[]> => { ... };
const [items, setItems] = useState<Item[]>([]);

// ❌ Bad
const fetchData = async (): Promise<any> => { ... };
const [items, setItems] = useState<any[]>([]);
```

### 3.3 事件处理类型

```tsx
// ✅ Good
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  onSubmit(data);
};
```

### 3.4 泛型组件

```tsx
// ✅ Good
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}
```

---

## 4. 性能优化

### 4.1 列表渲染

```tsx
// ✅ Good: 使用稳定的 key
{items.map((item) => (
  <TodoItem key={item.id} item={item} />
))}

// ❌ Bad: 使用 index 作为 key
{items.map((item, index) => (
  <TodoItem key={index} item={item} />
))}
```

### 4.2 懒加载

```tsx
// ✅ Good: 路由级别代码分割
const TodoDetail = React.lazy(() => import('./TodoDetail'));

const App = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/todo/:id" element={<TodoDetail />} />
    </Routes>
  </Suspense>
);
```

### 4.3 避免不必要的重渲染

```tsx
// ✅ Good: 使用 React.memo 包裹纯展示组件
const TodoItem = React.memo(({ item, onToggle }: TodoItemProps) => {
  return <div onClick={() => onToggle(item.id)}>{item.title}</div>;
});
```

### 4.4 防抖与节流

```tsx
// ✅ Good: 搜索输入防抖
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

---

## 5. 样式规范

### 5.1 CSS Modules / CSS-in-JS

```tsx
// ✅ Good: CSS Modules (Create React App 默认)
import styles from './Button.module.css';
<button className={styles.button} />;

// ✅ Good: 条件样式
<button
  className={`${styles.button} ${isActive ? styles.active : ''}`}
/>;
```

### 5.2 内联样式

```tsx
// ✅ Good: 动态样式使用内联
<div style={{ color: isError ? 'red' : 'green' }} />

// ❌ Bad: 静态样式使用内联
<div style={{ fontSize: '14px', color: '#333', marginTop: '16px' }} />
```

### 5.3 类名管理

```tsx
// ✅ Good: 使用 classnames 库
import cn from 'classnames';
<button className={cn(styles.btn, { [styles.active]: isActive })} />;
```

---

## 6. 状态管理

### 6.1 状态提升

- 多个子组件共享状态时，提升到最近的共同父组件
- 使用 `Context` 替代逐层 prop drilling

### 6.2 Context + useReducer

```tsx
// ✅ Good: 适合中大型状态
interface TodoState {
  items: Todo[];
  filter: FilterType;
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'SET_FILTER'; payload: FilterType };

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'ADD_TODO':
      return { ...state, items: [...state.items, action.payload] };
    case 'TOGGLE_TODO':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload
            ? { ...item, completed: !item.completed }
            : item
        ),
      };
    case 'DELETE_TODO':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
};
```

### 6.3 Props 下沉 vs Context

```tsx
// ✅ Good: 1-2 层直接传 props
<Parent>
  <Child value={value} />
</Parent>

// ✅ Good: 3+ 层使用 Context
const ThemeContext = createContext<Theme>('light');
<ThemeContext.Provider value={theme}>
  <DeepTree />
</ThemeContext.Provider>;
```

---

## 7. 测试规范

### 7.1 组件测试

```tsx
// ✅ Good: Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('toggles todo completion', async () => {
  const onToggle = jest.fn();
  render(<TodoItem id="1" title="测试" completed={false} onToggle={onToggle} />);

  const checkbox = screen.getByRole('checkbox');
  await userEvent.click(checkbox);

  expect(onToggle).toHaveBeenCalledWith('1');
});
```

### 7.2 测试原则

- 测试用户行为而非实现细节
- 优先使用 `getByRole`, `getByLabelText`, `getByPlaceholderText`
- 避免使用 `testId`（除非别无他法）
- 避免测试内部状态，测试渲染输出

```tsx
// ✅ Good
expect(screen.getByText('待办事项')).toBeInTheDocument();

// ❌ Bad
expect(component.state('isVisible')).toBe(true);
```

### 7.3 异步测试

```tsx
// ✅ Good: 等待异步操作完成
test('loads and displays todos', async () => {
  render(<TodoList />);

  expect(screen.getByText(/加载中/)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('买牛奶')).toBeInTheDocument();
  });
});
```

---

## 8. 安全规范

### 8.1 XSS 防护

```tsx
// ✅ Good: React 默认转义
<div>{userInput}</div>

// ❌ Bad: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// 如果必须使用 dangerouslySetInnerHTML，先 sanitize
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 8.2 URL 校验

```tsx
// ✅ Good: 校验 URL
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

<a href={isValidUrl(link) ? link : '#'}>{text}</a>
```

---

## 9. 可访问性

### 9.1 语义化 HTML

```tsx
// ✅ Good: 语义化标签
<nav aria-label="主导航">
  <ul>
    <li><a href="/">首页</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>文章标题</h1>
  </article>
</main>

// ❌ Bad: 全是 div
<div class="nav">
  <div>
    <div>首页</div>
  </div>
</div>
```

### 9.2 ARIA 属性

```tsx
// ✅ Good: 可访问的按钮
<button
  aria-label="删除待办事项"
  aria-disabled={isDeleting}
  onClick={handleDelete}
>
  <TrashIcon />
</button>

// ✅ Good: 加载状态
<div role="status" aria-live="polite">
  加载中...
</div>
```

### 9.3 键盘导航

```tsx
// ✅ Good: 支持键盘
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    onSelect(item);
  }
};

<div
  role="button"
  tabIndex={0}
  onClick={() => onSelect(item)}
  onKeyDown={handleKeyDown}
>
  {item.label}
</div>
```

### 9.4 颜色对比度

- 文本/背景对比度至少 4.5:1 (AA 标准)
- 大文本 (18px+ bold / 24px+) 至少 3:1
- 不要仅靠颜色传递信息

```tsx
// ✅ Good: 配合图标和文字
<span style={{ color: isError ? 'red' : 'green' }}>
  {isError ? '✗ 失败' : '✓ 成功'}
</span>
```

---

## 快速检查清单

### 代码提交前自查

- [ ] 组件是否单一职责？
- [ ] Props 类型是否完整定义？
- [ ] 是否有不必要的 `any`？
- [ ] Hooks 依赖数组是否正确？
- [ ] 列表 key 是否稳定且唯一？
- [ ] 是否有未使用的 import？
- [ ] 控制台是否有 warning / error？
- [ ] TypeScript 编译是否通过？
- [ ] 测试是否通过？
- [ ] 是否处理了 loading / empty / error 状态？
- [ ] 是否有可访问性问题？
- [ ] 是否有性能问题（不必要的重渲染）？
