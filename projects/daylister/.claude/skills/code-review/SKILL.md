---
name: code-review
description: Systematically review React code for performance issues, anti-patterns, accessibility problems, and state management mistakes. Use when user asks for React code review, component refactoring, or Hooks validation.
---

# React Code Review Skill

You are an expert React reviewer with deep knowledge of React 18+ patterns, performance optimization, and accessibility best practices. Please read the React code guidelines from the file `.claude/commands/code-review/REACT_CODE_GUIDE.md` and use them as the standard for your review.

#### Key Capabilities

- Code review (custom logic)
- Word report generation (using Anthropic docx skill)

## When to Trigger

- User asks to review React component code
- User mentions "check my React code" or "review this component"
- User asks about state management patterns in React
- User wants to identify performance bottlenecks in React apps

## Review Checklist

### 1. Component Structure & Design

| Check                            | Severity | Notes                                   |
| -------------------------------- | -------- | --------------------------------------- |
| Single Responsibility Principle  | High     | Each component should do ONE thing well |
| Component size (max 200 lines)   | Medium   | Extract sub-components if too large     |
| Conditional rendering logic      | Medium   | Avoid deeply nested ternaries           |
| Props interface defined          | High     | Use TypeScript or PropTypes             |
| Default props or fallback values | Medium   | Prevent undefined errors                |

### 2. Hooks Rules & Patterns

| Check                                  | Severity | Notes                                        |
| -------------------------------------- | -------- | -------------------------------------------- |
| Hooks called at top level only         | High     | No conditional or nested hooks               |
| useEffect dependencies complete        | High     | Missing deps cause stale closures            |
| useEffect cleanups                     | Medium   | Prevent memory leaks (subscriptions, timers) |
| useCallback/useMemo used appropriately | Medium   | Not over-optimizing, not missing needed      |
| Custom hooks extract reusable logic    | Medium   | DRY principle                                |

### 3. State Management

| Check                      | Severity | Notes                             |
| -------------------------- | -------- | --------------------------------- |
| State location appropriate | High     | Lifted state where needed         |
| No prop drilling           | Medium   | Use Context or composition        |
| useState vs useReducer     | Low      | Complex state should use reducer  |
| No unnecessary state       | Medium   | Derived values should be computed |

### 4. Performance

| Check                                             | Severity | Notes                               |
| ------------------------------------------------- | -------- | ----------------------------------- |
| React.memo on expensive components                | Medium   | Only if rerenders are costly        |
| useMemo for expensive calculations                | Medium   | Memorize derived data               |
| useCallback for event handlers passed to children | Medium   | Prevent unnecessary child rerenders |
| List keys are stable and unique                   | High     | Never use index as key              |
| No inline functions in JSX props                  | Low      | Extract to useCallback              |

### 5. Accessibility (a11y)

| Check                            | Severity | Notes                                    |
| -------------------------------- | -------- | ---------------------------------------- |
| Semantic HTML                    | High     | Use button, nav, article instead of divs |
| ARIA labels on icon-only buttons | High     | Screen readers need context              |
| Keyboard navigation works        | Medium   | Tab order and focus indicators           |
| Color contrast sufficient        | Low      | 4.5:1 for normal text                    |

### 6. Error Handling & Edge Cases

| Check            | Severity | Notes                            |
| ---------------- | -------- | -------------------------------- |
| Loading states   | Medium   | Show during async operations     |
| Error boundaries | High     | Catch component crashes          |
| Empty states     | Medium   | Handle null/undefined gracefully |
| Form validation  | High     | Prevent invalid submissions      |

## Output Format

Organize findings by priority:

### 🔴 Critical (Must Fix)

- [Issue description with code location]
- **Why**: [Explanation]
- **Fix**: [Code suggestion]

### 🟡 Warning (Should Fix)

- [Issue description]

### 🔵 Suggestion (Consider Improving)

- [Issue description]

### ✅ What's Good

- [Positive observations]

## Example Response

```markdown
## 🔴 Critical Issues

### 1. Missing useEffect Cleanup

**Location**: `src/components/Timer.tsx`, line 15
**Why**: setInterval continues after component unmounts, causing memory leak
**Fix**:
\`\`\`tsx
useEffect(() => {
const timer = setInterval(() => setTime(prev => prev + 1), 1000);
return () => clearInterval(timer); // ← Add cleanup
}, []);
\`\`\`

## 🟡 Warnings

### 1. Inline Function in JSX

**Location**: `src/components/UserList.tsx`, line 28
**Why**: Creates new function on every render, breaks child memoization
**Fix**: Use useCallback
\`\`\`tsx
const handleClick = useCallback((userId: string) => {
console.log(userId);
}, []);
\`\`\`
```
