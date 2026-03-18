/**
 * Unit Tests for Store Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { 
  validateStoreAccess, 
  optionalStoreValidation, 
  validateStoreOwnership,
  extractStoreId,
  getStoreContext,
  withStoreContext
} from '../src/middleware/storeValidation';
import { dataService } from '../src/services/dataService';
import { Store } from '../src/types/index';
import { cleanupTestData, generateTestStoreId } from './setup';

// Mock dataService
jest.mock('../src/services/dataService');
const mockedDataService = dataService as jest.Mocked<typeof dataService>;

describe('Store Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let testStoreIds: string[] = [];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockReq = {
      params: {},
      body: {},
      query: {},
      headers: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  afterEach(async () => {
    // Clean up test data
    if (testStoreIds.length > 0) {
      await cleanupTestData(['stores'], testStoreIds);
      testStoreIds = [];
    }
  });

  describe('validateStoreAccess', () => {
    it('should validate store from request parameters', async () => {
      const testStoreId = generateTestStoreId();
      testStoreIds.push(testStoreId);
      
      const mockStore: Store = {
        id: testStoreId,
        name: 'Test Store',
        country: 'United States',
        currency_symbol: '$',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockReq.params = { storeId: testStoreId };
      mockedDataService.readData.mockResolvedValue([mockStore]);

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.storeContext).toEqual({
        storeId: testStoreId,
        store: mockStore
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate store from request body', async () => {
      const testStoreId = generateTestStoreId();
      testStoreIds.push(testStoreId);
      
      const mockStore: Store = {
        id: testStoreId,
        name: 'Test Store',
        country: 'United States',
        currency_symbol: '$',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockReq.body = { store_id: testStoreId };
      mockedDataService.readData.mockResolvedValue([mockStore]);

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.storeContext?.storeId).toBe(testStoreId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate store from query parameters', async () => {
      const testStoreId = generateTestStoreId();
      testStoreIds.push(testStoreId);
      
      const mockStore: Store = {
        id: testStoreId,
        name: 'Test Store',
        country: 'United States',
        currency_symbol: '$',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockReq.query = { store_id: testStoreId };
      mockedDataService.readData.mockResolvedValue([mockStore]);

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.storeContext?.storeId).toBe(testStoreId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate store from headers', async () => {
      const testStoreId = generateTestStoreId();
      testStoreIds.push(testStoreId);
      
      const mockStore: Store = {
        id: testStoreId,
        name: 'Test Store',
        country: 'United States',
        currency_symbol: '$',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockReq.headers = { 'x-store-id': testStoreId };
      mockedDataService.readData.mockResolvedValue([mockStore]);

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.storeContext?.storeId).toBe(testStoreId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 when no store ID is provided', async () => {
      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Store ID is required',
        message: 'Please provide a store ID in the request parameters, body, query, or headers'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when store ID is empty string', async () => {
      mockReq.params = { storeId: '   ' };

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid store ID format',
        message: 'Store ID must be a non-empty string'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when store does not exist', async () => {
      const nonExistentStoreId = 'non-existent-store';
      mockReq.params = { storeId: nonExistentStoreId };
      mockedDataService.readData.mockResolvedValue([]);

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Store not found',
        message: `Store with ID '${nonExistentStoreId}' does not exist`
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when store is inactive', async () => {
      const testStoreId = generateTestStoreId();
      const inactiveStore: Store = {
        id: testStoreId,
        name: 'Inactive Store',
        country: 'United States',
        currency_symbol: '$',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockReq.params = { storeId: testStoreId };
      mockedDataService.readData.mockResolvedValue([inactiveStore]);

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Store is inactive',
        message: `Store '${inactiveStore.name}' is currently inactive and cannot be accessed`
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const testStoreId = generateTestStoreId();
      mockReq.params = { storeId: testStoreId };
      mockedDataService.readData.mockRejectedValue(new Error('Database error'));

      await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error during store validation',
        message: 'An error occurred while validating store access'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalStoreValidation', () => {
    it('should continue without store context when no store ID provided', async () => {
      await optionalStoreValidation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.storeContext).toBeUndefined();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate store when store ID is provided', async () => {
      const testStoreId = generateTestStoreId();
      testStoreIds.push(testStoreId);
      
      const mockStore: Store = {
        id: testStoreId,
        name: 'Test Store',
        country: 'United States',
        currency_symbol: '$',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockReq.params = { storeId: testStoreId };
      mockedDataService.readData.mockResolvedValue([mockStore]);

      await optionalStoreValidation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.storeContext?.storeId).toBe(testStoreId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return error when invalid store ID is provided', async () => {
      mockReq.params = { storeId: 'invalid-store' };
      mockedDataService.readData.mockResolvedValue([]);

      await optionalStoreValidation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateStoreOwnership', () => {
    it('should continue when store context exists', async () => {
      mockReq.storeContext = {
        storeId: 'test-store',
        store: {
          id: 'test-store',
          name: 'Test Store',
          country: 'United States',
          currency_symbol: '$',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      await validateStoreOwnership(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return error when store context is missing', async () => {
      await validateStoreOwnership(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Store context not found',
        message: 'Store validation middleware must run before ownership validation'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Utility functions', () => {
    describe('extractStoreId', () => {
      it('should extract store ID from params', () => {
        mockReq.params = { storeId: 'test-store' };
        expect(extractStoreId(mockReq as Request)).toBe('test-store');
      });

      it('should extract store ID from body', () => {
        mockReq.body = { store_id: 'test-store' };
        expect(extractStoreId(mockReq as Request)).toBe('test-store');
      });

      it('should extract store ID from query', () => {
        mockReq.query = { store_id: 'test-store' };
        expect(extractStoreId(mockReq as Request)).toBe('test-store');
      });

      it('should extract store ID from headers', () => {
        mockReq.headers = { 'x-store-id': 'test-store' };
        expect(extractStoreId(mockReq as Request)).toBe('test-store');
      });

      it('should return null when no store ID found', () => {
        expect(extractStoreId(mockReq as Request)).toBeNull();
      });
    });

    describe('getStoreContext', () => {
      it('should return store context when available', () => {
        const storeContext = {
          storeId: 'test-store',
          store: {
            id: 'test-store',
            name: 'Test Store',
            country: 'United States',
            currency_symbol: '$',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
        mockReq.storeContext = storeContext;

        expect(getStoreContext(mockReq as Request)).toEqual(storeContext);
      });

      it('should return null when store context is not available', () => {
        expect(getStoreContext(mockReq as Request)).toBeNull();
      });
    });

    describe('withStoreContext', () => {
      it('should call handler with store context', async () => {
        const mockHandler = jest.fn();
        const wrappedHandler = withStoreContext(mockHandler);
        
        const storeContext = {
          storeId: 'test-store',
          store: {
            id: 'test-store',
            name: 'Test Store',
            country: 'United States',
            currency_symbol: '$',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
        mockReq.storeContext = storeContext;

        await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockHandler).toHaveBeenCalledWith(
          mockReq,
          mockRes,
          storeContext.storeId,
          storeContext.store
        );
      });

      it('should return error when store context is missing', async () => {
        const mockHandler = jest.fn();
        const wrappedHandler = withStoreContext(mockHandler);

        await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Store context required',
          message: 'This endpoint requires store validation middleware'
        });
        expect(mockHandler).not.toHaveBeenCalled();
      });

      it('should handle handler errors', async () => {
        const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
        const wrappedHandler = withStoreContext(mockHandler);
        
        mockReq.storeContext = {
          storeId: 'test-store'
        };

        await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
});