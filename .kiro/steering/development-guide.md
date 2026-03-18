# 开发指南

## 技术栈详情

### 核心技术
- **React 18**: 现代hooks和并发特性
- **TypeScript**: 严格类型检查
- **Vite**: 快速构建工具
- **Tailwind CSS**: 实用优先的CSS框架

### 状态管理
- **Zustand**: 轻量级状态管理 + 持久化
- **TanStack Query**: 服务端状态管理
- **React Hook Form**: 表单处理 + 验证
- **Zod**: 类型安全的数据验证

### UI组件
- **Lucide React**: 矢量图标库
- **Recharts**: 响应式图表组件
- **Ant Design**: 专业UI组件库(管理后台)

## 开发命令

```bash
# 开发环境
npm run dev              # 启动开发服务器
npm run build           # 生产构建
npm run preview         # 预览生产构建

# 后端
npm run dev             # nodemon开发服务器
npm run seed            # 生成初始数据
npm run backup          # 备份数据文件

# 管理后台
npm run dev             # 启动管理界面
```

## 代码规范

### 文件命名
- 组件: `PascalCase.tsx`
- Hook: `usePascalCase.ts`
- 工具: `camelCase.ts`
- 样式: `ComponentName.module.css`

### 组件结构
```typescript
interface ComponentProps {
  // props定义
}

const Component: React.FC<ComponentProps> = () => {
  // Hooks调用
  const navigate = useNavigate();
  const { t } = useI18n();
  
  // 状态定义
  const [state, setState] = useState();
  
  // 事件处理
  const handleClick = useCallback(() => {}, []);
  
  // 渲染
  return <div>{/* JSX */}</div>;
};
```

### 样式约定
```typescript
// Tailwind优先
className="w-full lg:w-1/2 xl:w-1/3"

// 条件样式
className={cn(
  "base-classes",
  condition && "conditional-classes"
)}

// Amazon主题色
className="text-amazon-text bg-amazon-teal"
```

## 路由架构

```
/auth/*                 # 认证页面
/app/dashboard          # 主仪表板
/app/inventory/*        # 库存管理(带侧边栏)
/app/business-reports/* # 业务报告(带侧边栏)
/app/settings/*         # 账户设置(带侧边栏)
```

## 状态管理模式

### Zustand Store
```typescript
interface AppStore {
  session: UserSession;
  dashboard: DashboardState;
  setSession: (session: Partial<UserSession>) => void;
  setMarketplace: (m: Marketplace) => void;
}

// 使用
const { session, setSession } = useStore();
const isLoggedIn = useStore(state => state.session.isLoggedIn);
```

### TanStack Query
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['inventory'],
  queryFn: fetchInventory,
  onError: (error) => console.error('Failed:', error)
});
```

## 国际化

### 翻译键命名
- 页面: `dashboard`, `inventory`
- 操作: `save`, `cancel`, `delete`
- 状态: `active`, `inactive`

### 使用模式
```typescript
const { t } = useI18n();

// 简单翻译
<span>{t('dashboard')}</span>

// 参数翻译
<span>{t('showItems', { from: 1, to: 10, total: 100 })}</span>
```

## API设计原则

### RESTful端点
- 一致的命名约定
- 正确的HTTP状态码
- JSON响应格式
- Zod请求验证

### 错误处理
```typescript
// 统一错误响应
{
  success: false,
  message: "Error description",
  code: "ERROR_CODE"
}
```

## 性能优化

### 组件优化
```typescript
// React.memo包装纯组件
const MemoizedComponent = React.memo(Component);

// useMemo缓存计算
const expensiveValue = useMemo(() => 
  computeExpensiveValue(data), [data]);

// useCallback缓存函数
const handleClick = useCallback(() => {}, [dependency]);
```

### 代码分割
```typescript
// 路由级代码分割
const Dashboard = React.lazy(() => import('./features/Dashboard'));
```

## 测试策略

### 文件命名
- 单元测试: `Component.test.tsx`
- 集成测试: `Feature.integration.test.tsx`

### 测试结构
```typescript
describe('Component', () => {
  beforeEach(() => {
    // 设置
  });

  it('should render correctly', () => {
    // 测试逻辑
  });
});
```

## Git工作流

### 提交格式
```
type(scope): description

feat(auth): add two-factor authentication
fix(dashboard): resolve chart rendering issue
docs(readme): update installation instructions
```

### 分支命名
- 功能: `feature/user-authentication`
- 修复: `fix/dashboard-chart-bug`
- 发布: `release/v1.2.0`