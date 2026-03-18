# 需求文档

## 简介

本规范定义了将现有Amazon卖家中心克隆项目重构和扩展为综合三层架构的需求。系统将把当前的React前端重新组织到`frontend/`文件夹中，在`backend/`文件夹中创建新的Node.js + Express + TypeScript后端，并在`backend-admin/`文件夹中构建管理界面。目标是实现Amazon卖家中心页面的精确1:1像素级复制，同时通过由H2数据库存储支持的管理界面提供完整的数据管理功能。

## 术语表

- **前端**: 现有的React 18 + TypeScript应用程序移至`frontend/`文件夹，修改为使用真实API
- **后端**: 新的Node.js + Express + TypeScript REST API服务器，使用H2数据库进行数据持久化
- **后端管理**: 新的React + Ant Design Pro管理界面，用于数据编辑和图片上传
- **仪表板**: 主要卖家仪表板页面，包含全局快照和产品性能
- **客户之声**: 客户反馈和评论管理页面
- **销售仪表板**: 综合销售分析和报告界面
- **账户健康**: 账户状态、性能指标和合规监控
- **法律实体**: 业务实体信息和法律合规页面
- **全局快照**: 六列指标显示（销售、订单、消息、优惠、反馈、付款）
- **产品性能表**: 包含图片、SKU、ASIN和指标的表格产品数据
- **可编辑数据**: 参考图像中用户标记的红色区域，可通过管理界面修改
- **H2数据库**: 存储所有应用程序数据的嵌入式数据库，具有预定义架构
- **图片上传**: 存储在本地文件系统中的产品图片文件上传系统
- **像素完美**: 精确的1:1视觉复制，匹配Amazon的间距、颜色、字体和布局

## 需求

### 需求1：项目结构重组

**用户故事：** 作为开发人员，我希望项目重新组织为前端/管理/后端文件夹，以便在显示、管理和API层之间保持清晰的分离。

#### 验收标准

1. 系统应创建包含当前React应用程序代码的"frontend"文件夹
2. 系统应创建带有React + Ant Design Pro的"admin"文件夹用于数据管理
3. 系统应创建带有Spring Boot 3.x应用程序和H2数据库的"backend"文件夹
4. 系统应在三个组件之间维护适当的依赖管理
5. 系统应为每个文件夹的用途和设置说明提供清晰的文档

### 需求2：带H2数据库的Node.js后端

**用户故事：** 作为系统管理员，我希望有一个强大的Node.js后端API和数据库持久化，以便可靠地存储和管理所有应用程序数据。

#### 验收标准

1. 后端应实现Node.js + Express + TypeScript与嵌入式H2数据库
2. 后端应为store、global_snapshot、product、sales_snapshot、cx_health、account_health和legal_entity创建数据库表
3. 后端应为所有数据实体的CRUD操作提供REST API端点
4. 后端应支持使用multer中间件进行产品图片管理的文件上传端点
5. 后端应在所有操作中包含适当的错误处理、验证和日志记录

### 需求3：带Ant Design Pro的管理界面

**用户故事：** 作为内容管理员，我希望有一个专业的管理界面来管理所有可编辑数据，以便轻松更新店铺信息、产品和指标。

#### 验收标准

1. 后端管理应实现React与Ant Design Pro以获得专业UI组件
2. 后端管理应为编辑参考图像中标记为红色的所有数据提供表单
3. 后端管理应包含支持拖放的图片上传功能
4. 后端管理应显示具有排序、过滤和分页功能的数据表
5. 后端管理应在保存到数据库之前提供更改的实时预览

### 需求4：带真实API集成的前端显示

**用户故事：** 作为卖家，我希望看到由真实数据驱动的像素完美Amazon卖家中心界面，以便体验真实的卖家仪表板环境。

#### 验收标准

1. 前端应将现有的React 18 + TypeScript代码移至`frontend/`文件夹，不更改UI组件
2. 前端应用真实的API调用替换所有模拟数据到Node.js后端
3. 前端应专门从Node.js后端API消费数据
4. 前端应显示通过管理界面上传的真实产品图片
5. 前端应保持现有的响应式设计和像素完美精度

### 需求5：数据库架构实现

**用户故事：** 作为后端开发人员，我希望有一个存储所有Amazon卖家中心数据的综合数据库架构，以便系统可以持久化和检索所有必要信息。

#### 验收标准

1. 后端应实现store表，包含store_name、country、marketplace_id和配置数据字段
2. 后端应创建global_snapshot表，存储销售、订单、消息、featured_offers、反馈和付款指标
3. 后端应实现product表，包含image_url、title、asin、sku、price、inventory、status和性能字段
4. 后端应创建sales_snapshot表用于历史销售数据和趋势分析
5. 后端应实现cx_health和account_health表用于客户体验和账户状态指标

### Requirement 6: Image Upload and Management System

**User Story:** As a content manager, I want to upload and manage product images, so that the frontend displays realistic product data.

#### Acceptance Criteria

1. THE System SHALL provide image upload functionality in the admin interface with support for JPG, PNG, and WebP formats
2. THE System SHALL store uploaded images in a local filesystem directory with proper organization
3. THE System SHALL generate and store image URLs in the database for frontend consumption
4. THE System SHALL provide image preview and replacement capabilities in the admin interface
5. THE System SHALL implement image optimization and resizing for consistent display quality

### Requirement 7: Editable Data Management

**User Story:** As a content manager, I want to edit all data fields marked in red in the reference images, so that I can customize the seller dashboard content.

#### Acceptance Criteria

1. THE Admin SHALL provide forms for editing store information including name, country, and marketplace settings
2. THE Admin SHALL allow modification of all global snapshot metrics with validation for numeric fields
3. THE Admin SHALL enable editing of product information including titles, prices, inventory, and status
4. THE Admin SHALL provide interfaces for updating CX health metrics and account health indicators
5. THE Admin SHALL include bulk edit capabilities for efficient management of multiple products

### Requirement 8: Five Target Pages Implementation

**User Story:** As a seller, I want to access all five key Amazon Seller Central pages, so that I can manage different aspects of my business.

#### Acceptance Criteria

1. THE Frontend SHALL implement the Dashboard page with global snapshot, product performance table, and action cards
2. THE Frontend SHALL create the Voice of Customer page displaying customer feedback, reviews, and satisfaction metrics
3. THE Frontend SHALL build the Sales Dashboard with comprehensive analytics, charts, and performance insights
4. THE Frontend SHALL implement the Account Health page showing compliance status, performance metrics, and policy information
5. THE Frontend SHALL create the Legal Entity page displaying business information, tax details, and legal compliance status

### Requirement 9: API Integration and Data Flow

**User Story:** As a system architect, I want seamless data flow between frontend, admin, and backend, so that all components work together cohesively.

#### Acceptance Criteria

1. THE Backend SHALL provide RESTful API endpoints for all data entities with proper HTTP status codes
2. THE Frontend SHALL consume Node.js backend APIs exclusively without any mock data dependencies
3. THE Backend_Admin SHALL use the same backend APIs for data modification and image upload operations
4. THE System SHALL implement proper error handling and loading states across all API interactions
5. THE System SHALL provide API documentation and testing capabilities for development purposes

### Requirement 10: Pixel-Perfect UI Replication

**User Story:** As a user, I want the interface to look exactly like Amazon Seller Central, so that I have an authentic experience.

#### Acceptance Criteria

1. THE Frontend SHALL replicate Amazon's exact color scheme, typography, and spacing measurements
2. THE Frontend SHALL implement identical layout structures, component positioning, and visual hierarchy
3. THE Frontend SHALL use Ant Design components customized to match Amazon's visual design language
4. THE Frontend SHALL maintain consistent styling across all five target pages
5. THE Frontend SHALL provide hover states, animations, and interactions that mirror Amazon's behavior

### Requirement 11: Data Validation and Error Handling

**User Story:** As a system user, I want robust data validation and clear error messages, so that I can use the system reliably.

#### Acceptance Criteria

1. THE Backend SHALL implement comprehensive input validation for all API endpoints using Joi or Zod
2. THE Backend_Admin SHALL provide client-side validation with clear error messages for form inputs
3. THE System SHALL handle database connection errors and provide appropriate fallback responses
4. THE System SHALL validate image uploads for file type, size, and format requirements
5. THE System SHALL log all errors appropriately for debugging and monitoring purposes

### Requirement 12: Performance and Optimization

**User Story:** As a user, I want fast loading times and smooth interactions, so that I can work efficiently.

#### Acceptance Criteria

1. THE Frontend SHALL maintain existing performance optimizations including lazy loading and code splitting
2. THE Backend SHALL optimize database queries and implement appropriate caching strategies with Redis or in-memory cache
3. THE System SHALL compress and optimize uploaded images for web display using Sharp or similar library
4. THE Frontend SHALL provide loading skeletons and progress indicators for better user experience
5. THE System SHALL maintain responsive performance across all three application tiers

### Requirement 13: Development and Deployment Setup

**User Story:** As a developer, I want clear setup instructions and development workflows, so that I can efficiently work on the project.

#### Acceptance Criteria

1. THE System SHALL provide comprehensive README files for each folder with setup and run instructions
2. THE System SHALL include package.json scripts for development, build, and deployment processes
3. THE System SHALL configure proper CORS settings for local development between frontend and backend
4. THE System SHALL provide sample data and database initialization scripts for development
5. THE System SHALL include environment configuration files for different deployment scenarios

### Requirement 14: Security and Access Control

**User Story:** As a system administrator, I want proper security measures in place, so that the application and data are protected.

#### Acceptance Criteria

1. THE Backend SHALL implement input sanitization and SQL injection prevention measures
2. THE System SHALL validate and restrict file upload types and sizes for security
3. THE Admin SHALL include basic authentication or access control for administrative functions
4. THE Backend SHALL implement proper CORS policies and request validation
5. THE System SHALL log security-related events and potential threats appropriately

### Requirement 15: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive testing capabilities, so that I can ensure code quality and reliability.

#### Acceptance Criteria

1. THE Frontend SHALL include unit tests for critical components using React Testing Library
2. THE Backend SHALL implement API endpoint testing with proper test data setup
3. THE System SHALL provide integration tests between frontend and backend components
4. THE Admin SHALL include form validation testing and user interaction testing
5. THE System SHALL maintain code quality standards with linting and formatting tools