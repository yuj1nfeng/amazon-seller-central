# 开发模式和最佳实践

## 通用开发技能

### React组件模式
```typescript
// 标准组件结构
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

### API端点模式
```typescript
// Express路由处理器
router.get('/api/endpoint', async (req, res) => {
  try {
    // 验证输入
    const validatedData = schema.parse(req.body);
    
    // 业务逻辑
    const result = await service.process(validatedData);
    
    // 返回响应
    res.json({ success: true, data: result });
  } catch (error) {
    // 错误处理
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 表单和验证模式
```typescript
// React Hook Form + Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### 状态管理模式
```typescript
// Zustand store
interface AppStore {
  session: UserSession;
  setSession: (session: Partial<UserSession>) => void;
}

const useStore = create<AppStore>()(
  persist(
    (set) => ({
      session: initialSession,
      setSession: (session) => set((state) => ({ 
        session: { ...state.session, ...session } 
      }))
    }),
    { name: 'app-store' }
  )
);
```

### 错误处理模式
```typescript
// 客户端错误边界
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// 服务端错误处理
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
};
```

### 性能优化模式
```typescript
// 组件优化
const MemoizedComponent = React.memo(Component);

// 计算缓存
const expensiveValue = useMemo(() => 
  computeExpensiveValue(data), [data]);

// 函数缓存
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependency]);

// 代码分割
const LazyComponent = React.lazy(() => import('./Component'));
```

### 国际化模式
```typescript
// 翻译键使用
const { t } = useI18n();

// 简单翻译
<span>{t('dashboard')}</span>

// 参数翻译
<span>{t('showItems', { from: 1, to: 10, total: 100 })}</span>

// 条件翻译
<span>{t(isActive ? 'active' : 'inactive')}</span>
```

### 文件操作模式
```typescript
// JSON文件处理
const readJsonFile = async (filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
};

// 图片上传处理
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
```

## 测试模式

### 单元测试
```typescript
describe('Component', () => {
  beforeEach(() => {
    // 设置
  });

  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const handleClick = jest.fn();
    render(<Component onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### API测试
```typescript
describe('API Endpoints', () => {
  it('should return data for valid request', async () => {
    const response = await request(app)
      .get('/api/data')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/data')
      .send({ invalid: 'data' })
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });
});
```

## 部署和配置模式

### 环境配置
```typescript
// 环境变量管理
const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};

// 环境特定设置
const isDevelopment = config.nodeEnv === 'development';
const isProduction = config.nodeEnv === 'production';
```

### CORS配置
```typescript
const corsOptions = {
  origin: config.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 安全模式
```typescript
// 输入验证
const validateInput = (schema: z.ZodSchema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid input' });
  }
};

// 速率限制
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100个请求
});
```