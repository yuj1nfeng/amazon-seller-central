# 代码规范

## 核心规范

### 文件命名
- 组件: `PascalCase.tsx`
- Hook: `usePascalCase.ts`
- 配置: `camelCase.ts`
- 样式: `ComponentName.module.css`

## 代码组织原则

### 导入顺序
```typescript
// 1. 外部库
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. 内部模块 (使用@/别名)
import { useStore } from '../store';
import { useI18n } from '../hooks/useI18n';

// 3. 相对导入
import './Component.css';
```

### 组件结构
```typescript
// 1. 类型定义
interface ComponentProps {
  // props定义
}

// 2. 常量定义
const CONSTANTS = {};

// 3. 主组件
const Component: React.FC<ComponentProps> = () => {
  // 4. Hooks调用
  const navigate = useNavigate();
  const { t } = useI18n();
  
  // 5. 状态定义
  const [state, setState] = useState();
  
  // 6. 事件处理函数
  const handleClick = () => {};
  
  // 7. 渲染逻辑
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

## 样式约定

### Tailwind CSS使用
- **优先使用Tailwind类** - 避免自定义CSS
- **Amazon主题色彩**:
  - `amazon-text` - 主文本色 #0F1111
  - `amazon-link` - 链接色 #007185
  - `amazon-teal` - 主题青色
  - `amazon-headerTeal` - 头部深青色
  - `amazon-error` - 错误红色

### 响应式设计
```typescript
// 移动优先的响应式类名
className="w-full lg:w-1/2 xl:w-1/3"

// 条件样式使用cn工具函数
className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' ? 'primary-classes' : 'secondary-classes'
)}
```

### 组件样式模式
```typescript
// 使用cn函数合并类名
import { cn } from '../utils/cn';

const buttonClass = cn(
  "base-button-classes",
  variant === 'yellow' ? 'amz-btn-yellow' : 'amz-btn-white',
  disabled && 'opacity-50 cursor-not-allowed'
);
```

## 状态管理约定

### Zustand Store结构
```typescript
interface AppStore {
  // 状态定义
  session: UserSession;
  dashboard: DashboardState;
  
  // 动作定义
  setSession: (session: Partial<UserSession>) => void;
  setMarketplace: (m: Marketplace) => void;
  logout: () => void;
}
```

### Hook使用模式
```typescript
// 解构需要的状态和动作
const { session, setSession } = useStore();

// 选择性订阅状态
const isLoggedIn = useStore(state => state.session.isLoggedIn);
```

## 国际化约定

### 翻译键命名
- **页面标题**: `dashboard`, `inventory`, `orders`
- **操作按钮**: `save`, `cancel`, `delete`, `edit`
- **状态文本**: `active`, `inactive`, `pending`
- **表单标签**: `emailAddress`, `password`, `confirmPassword`

### 使用模式
```typescript
const { t } = useI18n();

// 简单翻译
<span>{t('dashboard')}</span>

// 带参数翻译
<span>{t('showItems', { from: 1, to: 10, total: 100 })}</span>
```

## 路由约定

### 路径命名
- **kebab-case**: `/app/business-reports`, `/app/account-health`
- **嵌套路由**: `/app/settings/store-info`, `/app/business-reports/sales-dashboard`
- **动态路由**: `/app/products/:id`, `/app/orders/:orderId`

### 路由组织
```typescript
// 主路由在App.tsx中定义
<Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  {/* 无侧边栏页面 */}
  <Route path="dashboard" element={<Dashboard />} />
  
  {/* 带侧边栏页面 */}
  <Route path="inventory/*" element={<WithSidebarLayout />}>
    <Route index element={<Inventory />} />
    <Route path="fba" element={<FBAInventory />} />
  </Route>
</Route>
```

## 类型定义约定

### 接口命名
- **Props接口**: `ComponentNameProps`
- **状态接口**: `ComponentNameState`
- **API响应**: `ApiResponseType`
- **枚举类型**: `PascalCase` (如 `Marketplace`, `Language`)

### 类型导出
```typescript
// types.ts中集中定义和导出
export type Marketplace = 'United States' | 'Japan' | 'United Kingdom';
export interface UserSession {
  email: string;
  isLoggedIn: boolean;
  marketplace: Marketplace;
}
```

## 错误处理约定

### 组件错误边界
```typescript
// 使用Suspense包装异步组件
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

### API错误处理
```typescript
// 使用TanStack Query的错误处理
const { data, error, isLoading } = useQuery({
  queryKey: ['inventory'],
  queryFn: fetchInventory,
  onError: (error) => {
    console.error('Failed to fetch inventory:', error);
  }
});
```

## 性能优化约定

### 组件优化
```typescript
// 使用React.memo包装纯组件
const MemoizedComponent = React.memo(Component);

// 使用useMemo缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 使用useCallback缓存函数
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependency]);
```

### 代码分割
```typescript
// 使用React.lazy进行路由级代码分割
const Dashboard = React.lazy(() => import('./features/Dashboard'));
```

## 测试约定

### 文件命名
- **单元测试**: `Component.test.tsx`
- **集成测试**: `Feature.integration.test.tsx`
- **E2E测试**: `workflow.e2e.test.tsx`

### 测试结构
```typescript
describe('Component', () => {
  beforeEach(() => {
    // 设置
  });

  it('should render correctly', () => {
    // 测试逻辑
  });

  it('should handle user interactions', () => {
    // 交互测试
  });
});
```

## 注释约定

### JSDoc注释
```typescript
/**
 * 用户会话管理Hook
 * @returns {Object} 包含用户状态和操作方法的对象
 */
export const useUserSession = () => {
  // 实现
};
```

### 行内注释
```typescript
// TODO: 实现更复杂的筛选逻辑
// FIXME: 修复在移动端的显示问题
// NOTE: 这里使用了特殊的Amazon UI规范
```

## Git提交约定

### 提交信息格式
```
type(scope): description

feat(auth): add two-factor authentication
fix(dashboard): resolve chart rendering issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(store): simplify state management logic
test(inventory): add unit tests for filtering
```

### 分支命名
- **功能分支**: `feature/user-authentication`
- **修复分支**: `fix/dashboard-chart-bug`
- **发布分支**: `release/v1.2.0`
- **热修复**: `hotfix/critical-security-patch`