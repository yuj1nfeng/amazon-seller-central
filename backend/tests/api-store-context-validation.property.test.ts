/**
 * Property-Based Tests for API Store Context Validation
 * Feature: multi-store-internationalization-system
 * Property 8: API Store Context Validation
 * Validates: Requirements 6.1, 6.3
 */

import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { 
  validateStoreAccess, 
  optionalStoreValidation,
  extractStoreId 
} from '../src/middleware/storeValidation';
import { dataService } from '../src/services/dataService';
import { Store } from '../src/types/index';
import { cleanupTestData, generateTestStoreId } from './setup';

// Mock dataService for controlled testing
jest.mock('../src/services/dataService');
const mockedDataService = dataService as jest.Mocked<typeof dataService>;

describe('Property 8: API Store Context Validation', () => {
  let testStoreIds: string[] = [];

  afterEach(async () => {
    // Clean up test data after each test
    if (testStoreIds.length > 0) {
      await cleanupTestData(['stores'], testStoreIds);
      testStoreIds = [];
    }
    jest.clearAllMocks();
  });

  /**
   * Property: For any API request requiring store context, invalid or missing 
   * store_id parameters should result in appropriate error responses
   */
  test('API requests with invalid store context return appropriate error responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various invalid store ID scenarios
        fc.oneof(
          fc.constant(null), // No store ID
          fc.constant(''), // Empty string
          fc.constant('   '), // Whitespace only
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length === 0), // Whitespace strings
          fc.string({ minLength: 1, maxLength: 100 }) // Non-existent store IDs
        ),
        
        // Generate request source (where store ID comes from)
        fc.constantFrom('params', 'body', 'query', 'headers'),

        async (invalidStoreId, source) => {
          // Setup mock request and response
          const mockReq: Partial<Request> = {
            params: {},
            body: {},
            query: {},
            headers: {}
          };
          
          const mockRes: Partial<Response> = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
          };
          
          const mockNext: NextFunction = jest.fn();

          // Set invalid store ID in the specified source
          if (invalidStoreId !== null) {
            switch (source) {
              case 'params':
                mockReq.params = { storeId: invalidStoreId };
                break;
              case 'body':
                mockReq.body = { store_id: invalidStoreId };
                break;
              case 'query':
                mockReq.query = { store_id: invalidStoreId };
                break;
              case 'headers':
                mockReq.headers = { 'x-store-id': invalidStoreId };
                break;
            }
          }

          // Mock empty stores array (no stores exist)
          mockedDataService.readData.mockResolvedValue([]);

          // Test validateStoreAccess middleware
          await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

          // Property 8.1: Missing or empty store ID should return 400
          if (!invalidStoreId) {
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
              success: false,
              error: 'Store ID is required',
              message: 'Please provide a store ID in the request parameters, body, query, or headers'
            });
            expect(mockNext).not.toHaveBeenCalled();
            return;
          }

          // Property 8.2: Whitespace-only store ID should return 400 with format error
          if (typeof invalidStoreId === 'string' && invalidStoreId.trim().length === 0) {
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
              success: false,
              error: 'Invalid store ID format',
              message: 'Store ID must be a non-empty string'
            });
            expect(mockNext).not.toHaveBeenCalled();
            return;
          }

          // Property 8.2: Non-existent store ID should return 404
          if (typeof invalidStoreId === 'string' && invalidStoreId.trim().length > 0) {
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
              success: false,
              error: 'Store not found',
              message: `Store with ID '${invalidStoreId}' does not exist`
            });
            expect(mockNext).not.toHaveBeenCalled();
          }
        }
      ),
      { 
        numRuns: 25,
        timeout: 10000
      }
    );
  });

  /**
   * Property: Valid store IDs should pass validation and add store context
   */
  test('API requests with valid store context pass validation successfully', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid store data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          country: fc.constantFrom('United States', 'Japan', 'United Kingdom', 'Germany'),
          currency_symbol: fc.constantFrom('$', '¥', '£', '€'),
          is_active: fc.boolean()
        }),
        
        // Generate request source
        fc.constantFrom('params', 'body', 'query', 'headers'),

        async (storeData, source) => {
          const testStoreId = generateTestStoreId();
          testStoreIds.push(testStoreId);

          // Create mock store
          const mockStore: Store = {
            id: testStoreId,
            ...storeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Setup mock request and response
          const mockReq: Partial<Request> = {
            params: {},
            body: {},
            query: {},
            headers: {}
          };
          
          const mockRes: Partial<Response> = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
          };
          
          const mockNext: NextFunction = jest.fn();

          // Set valid store ID in the specified source
          switch (source) {
            case 'params':
              mockReq.params = { storeId: testStoreId };
              break;
            case 'body':
              mockReq.body = { store_id: testStoreId };
              break;
            case 'query':
              mockReq.query = { store_id: testStoreId };
              break;
            case 'headers':
              mockReq.headers = { 'x-store-id': testStoreId };
              break;
          }

          // Mock store exists in database
          mockedDataService.readData.mockResolvedValue([mockStore]);

          // Test validateStoreAccess middleware
          await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

          if (mockStore.is_active) {
            // Property 8.4: Valid active store should pass validation
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.storeContext).toEqual({
              storeId: testStoreId,
              store: mockStore
            });
          } else {
            // Property 8.5: Inactive store should return 403
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
              success: false,
              error: 'Store is inactive',
              message: `Store '${mockStore.name}' is currently inactive and cannot be accessed`
            });
            expect(mockNext).not.toHaveBeenCalled();
          }
        }
      ),
      { 
        numRuns: 20,
        timeout: 10000
      }
    );
  });

  /**
   * Property: Optional store validation should handle both valid and missing store IDs
   */
  test('Optional store validation handles all scenarios correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate store ID scenarios (including null for no store ID)
        fc.oneof(
          fc.constant(null), // No store ID provided
          fc.record({
            storeId: fc.string({ minLength: 1, maxLength: 50 }),
            exists: fc.boolean(),
            isActive: fc.boolean()
          })
        ),
        
        fc.constantFrom('params', 'body', 'query', 'headers'),

        async (storeScenario, source) => {
          // Setup mock request and response
          const mockReq: Partial<Request> = {
            params: {},
            body: {},
            query: {},
            headers: {}
          };
          
          const mockRes: Partial<Response> = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
          };
          
          const mockNext: NextFunction = jest.fn();

          if (storeScenario === null) {
            // No store ID provided - should continue without store context
            mockedDataService.readData.mockResolvedValue([]);
            
            await optionalStoreValidation(mockReq as Request, mockRes as Response, mockNext);
            
            // Property 8.6: Optional validation without store ID should continue
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.storeContext).toBeUndefined();
            
          } else {
            const { storeId, exists, isActive } = storeScenario;
            testStoreIds.push(storeId);

            // Set store ID in request
            switch (source) {
              case 'params':
                mockReq.params = { storeId };
                break;
              case 'body':
                mockReq.body = { store_id: storeId };
                break;
              case 'query':
                mockReq.query = { store_id: storeId };
                break;
              case 'headers':
                mockReq.headers = { 'x-store-id': storeId };
                break;
            }

            if (exists) {
              const mockStore: Store = {
                id: storeId,
                name: `Test Store ${storeId}`,
                country: 'United States',
                currency_symbol: '$',
                is_active: isActive,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              mockedDataService.readData.mockResolvedValue([mockStore]);
              
              await optionalStoreValidation(mockReq as Request, mockRes as Response, mockNext);
              
              if (isActive) {
                // Property 8.7: Optional validation with valid store should add context
                expect(mockNext).toHaveBeenCalled();
                expect(mockRes.status).not.toHaveBeenCalled();
                expect(mockReq.storeContext).toEqual({
                  storeId,
                  store: mockStore
                });
              } else {
                // Property 8.8: Optional validation with inactive store should return 403
                expect(mockRes.status).toHaveBeenCalledWith(403);
                expect(mockNext).not.toHaveBeenCalled();
              }
            } else {
              mockedDataService.readData.mockResolvedValue([]);
              
              await optionalStoreValidation(mockReq as Request, mockRes as Response, mockNext);
              
              // Property 8.9: Optional validation with non-existent store should return 404
              expect(mockRes.status).toHaveBeenCalledWith(404);
              expect(mockNext).not.toHaveBeenCalled();
            }
          }
        }
      ),
      { 
        numRuns: 20,
        timeout: 10000
      }
    );
  });

  /**
   * Property: Store ID extraction should work consistently across all sources
   */
  test('Store ID extraction works consistently from all request sources', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom('params', 'body', 'query', 'headers'),

        async (storeId, source) => {
          const mockReq: Partial<Request> = {
            params: {},
            body: {},
            query: {},
            headers: {}
          };

          // Set store ID in the specified source
          switch (source) {
            case 'params':
              mockReq.params = { storeId };
              break;
            case 'body':
              mockReq.body = { store_id: storeId };
              break;
            case 'query':
              mockReq.query = { store_id: storeId };
              break;
            case 'headers':
              mockReq.headers = { 'x-store-id': storeId };
              break;
          }

          // Property 8.10: Store ID extraction should return the correct ID
          const extractedId = extractStoreId(mockReq as Request);
          expect(extractedId).toBe(storeId);
        }
      ),
      { 
        numRuns: 15,
        timeout: 5000
      }
    );
  });

  /**
   * Property: Database errors should be handled gracefully
   */
  test('Database errors during store validation are handled gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('params', 'body', 'query', 'headers'),

        async (storeId, source) => {
          testStoreIds.push(storeId);

          // Setup mock request and response
          const mockReq: Partial<Request> = {
            params: {},
            body: {},
            query: {},
            headers: {}
          };
          
          const mockRes: Partial<Response> = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
          };
          
          const mockNext: NextFunction = jest.fn();

          // Set store ID in request
          switch (source) {
            case 'params':
              mockReq.params = { storeId };
              break;
            case 'body':
              mockReq.body = { store_id: storeId };
              break;
            case 'query':
              mockReq.query = { store_id: storeId };
              break;
            case 'headers':
              mockReq.headers = { 'x-store-id': storeId };
              break;
          }

          // Mock database error
          mockedDataService.readData.mockRejectedValue(new Error('Database connection failed'));

          await validateStoreAccess(mockReq as Request, mockRes as Response, mockNext);

          // Property 8.11: Database errors should return 500
          expect(mockRes.status).toHaveBeenCalledWith(500);
          expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: 'Internal server error during store validation',
            message: 'An error occurred while validating store access'
          });
          expect(mockNext).not.toHaveBeenCalled();
        }
      ),
      { 
        numRuns: 10,
        timeout: 5000
      }
    );
  });

  /**
   * Property: Store ID precedence should follow the correct order
   */
  test('Store ID precedence follows params > body > query > headers order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }), // params
          fc.string({ minLength: 1, maxLength: 20 }), // body
          fc.string({ minLength: 1, maxLength: 20 }), // query
          fc.string({ minLength: 1, maxLength: 20 })  // headers
        ).filter(([p, b, q, h]) => p !== b && b !== q && q !== h && p !== q && p !== h && b !== h),

        async ([paramsId, bodyId, queryId, headersId]) => {
          const mockReq: Partial<Request> = {
            params: { storeId: paramsId },
            body: { store_id: bodyId },
            query: { store_id: queryId },
            headers: { 'x-store-id': headersId }
          };

          // Property 8.12: Params should take precedence
          expect(extractStoreId(mockReq as Request)).toBe(paramsId);

          // Test body precedence over query and headers
          mockReq.params = {};
          expect(extractStoreId(mockReq as Request)).toBe(bodyId);

          // Test query precedence over headers
          mockReq.body = {};
          expect(extractStoreId(mockReq as Request)).toBe(queryId);

          // Test headers as last resort
          mockReq.query = {};
          expect(extractStoreId(mockReq as Request)).toBe(headersId);
        }
      ),
      { 
        numRuns: 10,
        timeout: 5000
      }
    );
  });
});