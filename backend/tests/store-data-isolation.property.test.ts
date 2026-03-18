/**
 * Property-Based Tests for Store Data Isolation
 * Feature: multi-store-internationalization-system
 * Property 1: Store Data Isolation
 * Validates: Requirements 1.2, 1.3
 */

import * as fc from 'fast-check';
import { dataService } from '../src/services/dataService';
import { Product, DailySales, GlobalSnapshot } from '../src/types/index';
import { cleanupTestData, generateTestStoreId } from './setup';

describe('Property 1: Store Data Isolation', () => {
  const testCollections = ['products', 'daily_sales', 'global_snapshots'];
  let testStoreIds: string[] = [];

  afterEach(async () => {
    // Clean up test data after each test
    if (testStoreIds.length > 0) {
      await cleanupTestData(testCollections, testStoreIds);
      testStoreIds = [];
    }
  });

  /**
   * Property: For any two different stores, data operations on one store 
   * should never affect or return data from another store
   */
  test('Store data operations maintain complete isolation between stores', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different store IDs
        fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
          .filter(([store1, store2]) => store1 !== store2)
          .map(([store1, store2]) => [
            generateTestStoreId(store1.slice(0, 10)),
            generateTestStoreId(store2.slice(0, 10))
          ]),
        
        // Generate test products for both stores
        fc.array(fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          asin: fc.string({ minLength: 10, maxLength: 10 }),
          sku: fc.string({ minLength: 1, maxLength: 50 }),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99) }),
          inventory: fc.integer({ min: 0, max: 10000 }),
          fulfillment_type: fc.constantFrom('FBA', 'FBM'),
          status: fc.constantFrom('Active', 'Inactive'),
          sales_amount: fc.float({ min: Math.fround(0), max: Math.fround(10000) }),
          units_sold: fc.integer({ min: 0, max: 1000 }),
          page_views: fc.integer({ min: 0, max: 10000 }),
          ncx_rate: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          ncx_orders: fc.integer({ min: 0, max: 100 }),
          total_orders: fc.integer({ min: 0, max: 1000 }),
          star_rating: fc.float({ min: Math.fround(0), max: Math.fround(5) }),
          cx_health_status: fc.constantFrom('Very Poor', 'Poor', 'Fair', 'Good', 'Excellent')
        }), { minLength: 1, maxLength: 10 }),

        fc.array(fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          asin: fc.string({ minLength: 10, maxLength: 10 }),
          sku: fc.string({ minLength: 1, maxLength: 50 }),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99) }),
          inventory: fc.integer({ min: 0, max: 10000 }),
          fulfillment_type: fc.constantFrom('FBA', 'FBM'),
          status: fc.constantFrom('Active', 'Inactive'),
          sales_amount: fc.float({ min: Math.fround(0), max: Math.fround(10000) }),
          units_sold: fc.integer({ min: 0, max: 1000 }),
          page_views: fc.integer({ min: 0, max: 10000 }),
          ncx_rate: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
          ncx_orders: fc.integer({ min: 0, max: 100 }),
          total_orders: fc.integer({ min: 0, max: 1000 }),
          star_rating: fc.float({ min: Math.fround(0), max: Math.fround(5) }),
          cx_health_status: fc.constantFrom('Very Poor', 'Poor', 'Fair', 'Good', 'Excellent')
        }), { minLength: 1, maxLength: 10 }),

        async ([storeId1, storeId2], store1Products, store2Products) => {
          // Track test store IDs for cleanup
          testStoreIds = [storeId1, storeId2];

          // Create products for store 1
          const createdStore1Products = [];
          for (const productData of store1Products) {
            const product = await dataService.createStoreData<Product>('products', {
              store_id: storeId1,
              ...productData
            });
            createdStore1Products.push(product);
          }

          // Create products for store 2
          const createdStore2Products = [];
          for (const productData of store2Products) {
            const product = await dataService.createStoreData<Product>('products', {
              store_id: storeId2,
              ...productData
            });
            createdStore2Products.push(product);
          }

          // Property 1.1: Store 1 should only see its own products
          const store1RetrievedProducts = await dataService.readStoreData<Product>('products', storeId1);
          
          // All retrieved products should belong to store 1
          for (const product of store1RetrievedProducts) {
            expect(product.store_id).toBe(storeId1);
          }
          
          // Should not contain any products from store 2
          const store2ProductIds = createdStore2Products.map(p => p.id);
          const hasStore2Products = store1RetrievedProducts.some(p => store2ProductIds.includes(p.id));
          expect(hasStore2Products).toBe(false);

          // Property 1.2: Store 2 should only see its own products
          const store2RetrievedProducts = await dataService.readStoreData<Product>('products', storeId2);
          
          // All retrieved products should belong to store 2
          for (const product of store2RetrievedProducts) {
            expect(product.store_id).toBe(storeId2);
          }
          
          // Should not contain any products from store 1
          const store1ProductIds = createdStore1Products.map(p => p.id);
          const hasStore1Products = store2RetrievedProducts.some(p => store1ProductIds.includes(p.id));
          expect(hasStore1Products).toBe(false);

          // Property 1.3: Count verification
          expect(store1RetrievedProducts.length).toBe(createdStore1Products.length);
          expect(store2RetrievedProducts.length).toBe(createdStore2Products.length);

          // Property 1.4: Update operations should respect store boundaries
          if (createdStore1Products.length > 0) {
            const productToUpdate = createdStore1Products[0];
            const newPrice = Math.random() * 1000;
            
            // Should be able to update with correct store ID
            const updatedProduct = await dataService.updateStoreData<Product>(
              'products', 
              productToUpdate.id, 
              storeId1, 
              { price: newPrice }
            );
            expect(updatedProduct).not.toBeNull();
            expect(updatedProduct!.price).toBe(newPrice);
            
            // Should NOT be able to update with wrong store ID
            const invalidUpdate = await dataService.updateStoreData<Product>(
              'products', 
              productToUpdate.id, 
              storeId2, 
              { price: 99999 }
            );
            expect(invalidUpdate).toBeNull();
          }

          // Property 1.5: Delete operations should respect store boundaries
          if (createdStore2Products.length > 0) {
            const productToDelete = createdStore2Products[0];
            
            // Should NOT be able to delete with wrong store ID
            const invalidDelete = await dataService.deleteStoreData<Product>(
              'products', 
              productToDelete.id, 
              storeId1
            );
            expect(invalidDelete).toBe(false);
            
            // Should be able to delete with correct store ID
            const validDelete = await dataService.deleteStoreData<Product>(
              'products', 
              productToDelete.id, 
              storeId2
            );
            expect(validDelete).toBe(true);
            
            // Verify product is deleted from store 2 but store 1 is unaffected
            const store2ProductsAfterDelete = await dataService.readStoreData<Product>('products', storeId2);
            const store1ProductsAfterDelete = await dataService.readStoreData<Product>('products', storeId1);
            
            expect(store2ProductsAfterDelete.length).toBe(createdStore2Products.length - 1);
            expect(store1ProductsAfterDelete.length).toBe(createdStore1Products.length);
          }
        }
      ),
      { 
        numRuns: 20, // Run 20 iterations for thorough testing
        timeout: 30000 // 30 second timeout per test
      }
    );
  });

  /**
   * Property: Bulk operations should maintain store isolation
   */
  test('Bulk operations maintain store data isolation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate store IDs and bulk data
        fc.tuple(
          fc.string({ minLength: 1 }).map(s => generateTestStoreId(s.slice(0, 10))),
          fc.string({ minLength: 1 }).map(s => generateTestStoreId(s.slice(0, 10)))
        ).filter(([store1, store2]) => store1 !== store2),
        
        fc.array(fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }),
          asin: fc.string({ minLength: 10, maxLength: 10 }),
          sku: fc.string({ minLength: 1, maxLength: 20 }),
          price: fc.float({ min: Math.fround(1), max: Math.fround(1000) }),
          inventory: fc.integer({ min: 0, max: 1000 }),
          fulfillment_type: fc.constantFrom('FBA', 'FBM'),
          status: fc.constantFrom('Active', 'Inactive'),
          sales_amount: fc.float({ min: Math.fround(0), max: Math.fround(5000) }),
          units_sold: fc.integer({ min: 0, max: 500 }),
          page_views: fc.integer({ min: 0, max: 5000 }),
          ncx_rate: fc.float({ min: Math.fround(0), max: Math.fround(50) }),
          ncx_orders: fc.integer({ min: 0, max: 50 }),
          total_orders: fc.integer({ min: 0, max: 500 }),
          star_rating: fc.float({ min: Math.fround(0), max: Math.fround(5) }),
          cx_health_status: fc.constantFrom('Very Poor', 'Poor', 'Fair', 'Good', 'Excellent')
        }), { minLength: 2, maxLength: 5 }),

        async ([storeId1, storeId2], bulkProductData) => {
          testStoreIds = [storeId1, storeId2];

          // Create bulk data for store 1
          const store1BulkData = bulkProductData.map(data => ({
            store_id: storeId1,
            ...data
          }));

          const store1CreatedProducts = await dataService.bulkCreateStoreData<Product>(
            'products', 
            store1BulkData
          );

          // Create bulk data for store 2
          const store2BulkData = bulkProductData.map(data => ({
            store_id: storeId2,
            ...data,
            sku: data.sku + '-store2' // Ensure unique SKUs
          }));

          const store2CreatedProducts = await dataService.bulkCreateStoreData<Product>(
            'products', 
            store2BulkData
          );

          // Verify bulk creation isolation
          const store1Products = await dataService.readStoreData<Product>('products', storeId1);
          const store2Products = await dataService.readStoreData<Product>('products', storeId2);

          // Each store should only have its own products
          expect(store1Products.length).toBe(store1CreatedProducts.length);
          expect(store2Products.length).toBe(store2CreatedProducts.length);

          // Verify no cross-contamination
          const store1ProductIds = store1Products.map(p => p.id);
          const store2ProductIds = store2Products.map(p => p.id);
          
          const store1HasStore2Products = store1ProductIds.some(id => 
            store2ProductIds.includes(id)
          );
          const store2HasStore1Products = store2ProductIds.some(id => 
            store1ProductIds.includes(id)
          );

          expect(store1HasStore2Products).toBe(false);
          expect(store2HasStore1Products).toBe(false);

          // Test bulk delete isolation
          const store1ProductIdsToDelete = store1ProductIds.slice(0, Math.floor(store1ProductIds.length / 2));
          
          const deletedCount = await dataService.bulkDeleteStoreData<Product>(
            'products',
            storeId1,
            store1ProductIdsToDelete
          );

          expect(deletedCount).toBe(store1ProductIdsToDelete.length);

          // Verify store 2 is unaffected by store 1's bulk delete
          const store2ProductsAfterDelete = await dataService.readStoreData<Product>('products', storeId2);
          expect(store2ProductsAfterDelete.length).toBe(store2CreatedProducts.length);
        }
      ),
      { 
        numRuns: 15,
        timeout: 30000
      }
    );
  });

  /**
   * Property: Store deletion should only affect the specified store
   */
  test('Store deletion operations maintain isolation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1 }).map(s => generateTestStoreId(s.slice(0, 10))),
          fc.string({ minLength: 1 }).map(s => generateTestStoreId(s.slice(0, 10))),
          fc.string({ minLength: 1 }).map(s => generateTestStoreId(s.slice(0, 10)))
        ).filter(([s1, s2, s3]) => s1 !== s2 && s2 !== s3 && s1 !== s3),

        fc.integer({ min: 1, max: 5 }),

        async ([storeId1, storeId2, storeId3], itemCount) => {
          testStoreIds = [storeId1, storeId2, storeId3];

          // Create test data for all three stores
          const stores = [storeId1, storeId2, storeId3];
          const createdProductCounts: Record<string, number> = {};

          for (const storeId of stores) {
            for (let i = 0; i < itemCount; i++) {
              await dataService.createStoreData<Product>('products', {
                store_id: storeId,
                title: `Product ${i} for ${storeId}`,
                asin: `B${storeId.slice(-8)}${i.toString().padStart(2, '0')}`,
                sku: `SKU-${storeId}-${i}`,
                price: Math.random() * 100,
                inventory: Math.floor(Math.random() * 100),
                fulfillment_type: 'FBA',
                status: 'Active',
                sales_amount: Math.random() * 1000,
                units_sold: Math.floor(Math.random() * 100),
                page_views: Math.floor(Math.random() * 1000),
                ncx_rate: Math.random() * 10,
                ncx_orders: Math.floor(Math.random() * 10),
                total_orders: Math.floor(Math.random() * 100),
                star_rating: Math.random() * 5,
                cx_health_status: 'Good'
              });
            }
            createdProductCounts[storeId] = itemCount;
          }

          // Verify initial state
          for (const storeId of stores) {
            const products = await dataService.readStoreData<Product>('products', storeId);
            expect(products.length).toBe(createdProductCounts[storeId]);
          }

          // Delete all data for store 2
          const deletedCount = await dataService.deleteAllStoreData<Product>('products', storeId2);
          expect(deletedCount).toBe(createdProductCounts[storeId2]);

          // Verify store 2 has no data
          const store2ProductsAfterDelete = await dataService.readStoreData<Product>('products', storeId2);
          expect(store2ProductsAfterDelete.length).toBe(0);

          // Verify stores 1 and 3 are unaffected
          const store1ProductsAfterDelete = await dataService.readStoreData<Product>('products', storeId1);
          const store3ProductsAfterDelete = await dataService.readStoreData<Product>('products', storeId3);

          expect(store1ProductsAfterDelete.length).toBe(createdProductCounts[storeId1]);
          expect(store3ProductsAfterDelete.length).toBe(createdProductCounts[storeId3]);

          // Verify no cross-contamination
          for (const product of store1ProductsAfterDelete) {
            expect(product.store_id).toBe(storeId1);
          }
          for (const product of store3ProductsAfterDelete) {
            expect(product.store_id).toBe(storeId3);
          }
        }
      ),
      { 
        numRuns: 10,
        timeout: 30000
      }
    );
  });
});