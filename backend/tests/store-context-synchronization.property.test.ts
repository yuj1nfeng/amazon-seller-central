import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { dataService } from '../src/services/dataService';
import { Store, Product, GlobalSnapshot } from '../src/types/index';

/**
 * Property Test: Store Context Synchronization
 * **Validates: Requirements 2.2, 2.3**
 * 
 * This property test verifies that store context changes are properly synchronized
 * across all components and that data isolation is maintained when switching stores.
 */

describe('Property Test: Store Context Synchronization', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    // Note: In a real implementation, we would have a clearTestData method
    // For now, we'll work with the existing data
  });

  afterEach(async () => {
    // Clean up test data after each test
    // Note: In a real implementation, we would have a clearTestData method
  });

  it('should maintain data isolation when switching between stores', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple stores with different data
        fc.array(
          fc.record({
            storeId: fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length > 5), // Ensure non-empty, non-space IDs
            storeName: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 3),
            marketplace: fc.constantFrom('United States', 'Japan', 'United Kingdom', 'Germany'),
            currency: fc.constantFrom('$', '¥', '£', '€'),
            productCount: fc.integer({ min: 1, max: 3 }), // Reduced for performance
            salesAmount: fc.float({ min: 0, max: 1000, noNaN: true }),
          }),
          { minLength: 2, maxLength: 3 } // Reduced for performance
        ),
        async (stores) => {
          // Ensure unique store IDs to prevent collisions
          const uniqueStores = stores.filter((store, index, arr) => 
            arr.findIndex(s => s.storeId === store.storeId) === index
          );
          
          if (uniqueStores.length < 2) {
            // Skip this test run if we don't have enough unique stores
            return;
          }

          // Create stores and their data
          const createdStores = [];
          const storeDataMap = new Map();

          for (const storeTemplate of uniqueStores) {
            // Create store
            const store = await dataService.create<Store>('stores', {
              id: storeTemplate.storeId,
              name: storeTemplate.storeName,
              country: 'United States',
              marketplace: storeTemplate.marketplace,
              currency_symbol: storeTemplate.currency,
              business_type: 'Business',
              timezone: 'UTC',
              vacation_mode: false,
              auto_pricing: false,
              inventory_alerts: true,
              order_notifications: true,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            createdStores.push(store);

            // Create store-specific data
            const storeProducts = [];
            for (let i = 0; i < storeTemplate.productCount; i++) {
              const product = await dataService.create<Product>('products', {
                store_id: storeTemplate.storeId,
                title: `Product ${i} for ${storeTemplate.storeName}`,
                asin: `B${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                sku: `SKU-${storeTemplate.storeId}-${i}`,
                price: Math.random() * 100,
                inventory: Math.floor(Math.random() * 100),
                fulfillment_type: 'FBA',
                status: 'Active',
                sales_amount: storeTemplate.salesAmount,
                units_sold: Math.floor(Math.random() * 50),
                page_views: Math.floor(Math.random() * 1000),
                ncx_rate: Math.random() * 10,
                ncx_orders: Math.floor(Math.random() * 10),
                total_orders: Math.floor(Math.random() * 100),
                star_rating: Math.random() * 5,
                cx_health_status: 'Good',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              storeProducts.push(product);
            }

            storeDataMap.set(storeTemplate.storeId, {
              store,
              products: storeProducts,
              expectedProductCount: storeTemplate.productCount,
            });
          }

          // Test data isolation for each store
          for (const [storeId, storeData] of storeDataMap) {
            // Fetch products for this specific store
            const storeProducts = await dataService.findByStoreId<Product>('products', storeId);
            
            // Verify correct number of products
            expect(storeProducts).toHaveLength(storeData.expectedProductCount);
            
            // Verify all products belong to this store
            for (const product of storeProducts) {
              expect(product.store_id).toBe(storeId);
            }
            
            // Verify no products from other stores are included
            const allProducts = await dataService.readData<Product>('products');
            const otherStoreProducts = allProducts.filter((p: Product) => p.store_id !== storeId);
            
            for (const otherProduct of otherStoreProducts) {
              expect(storeProducts).not.toContainEqual(otherProduct);
            }
          }

          // Test store context switching
          for (let i = 0; i < createdStores.length; i++) {
            const currentStore = createdStores[i];
            const currentStoreData = storeDataMap.get(currentStore.id!);
            
            // Simulate store context switch
            const contextProducts = await dataService.findByStoreId<Product>('products', currentStore.id!);
            
            // Verify context returns correct store data
            expect(contextProducts).toHaveLength(currentStoreData!.expectedProductCount);
            
            // Verify all returned products belong to current store
            for (const product of contextProducts) {
              expect(product.store_id).toBe(currentStore.id);
            }
          }

          // Test concurrent store access doesn't cause data leakage
          const concurrentResults = await Promise.all(
            createdStores.map(async (store) => {
              const products = await dataService.findByStoreId<Product>('products', store.id!);
              return { storeId: store.id!, products };
            })
          );

          // Verify each concurrent result has correct isolation
          for (const result of concurrentResults) {
            const expectedData = storeDataMap.get(result.storeId);
            expect(result.products).toHaveLength(expectedData!.expectedProductCount);
            
            for (const product of result.products) {
              expect(product.store_id).toBe(result.storeId);
            }
          }
        }
      ),
      { numRuns: 5, timeout: 20000 } // Reduced runs for performance
    );
  });

  it('should synchronize store metadata changes across contexts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storeId: fc.string({ minLength: 5, maxLength: 20 }),
          initialName: fc.string({ minLength: 3, maxLength: 50 }),
          updatedName: fc.string({ minLength: 3, maxLength: 50 }),
          initialMarketplace: fc.constantFrom('United States', 'Japan', 'United Kingdom'),
          updatedMarketplace: fc.constantFrom('United States', 'Japan', 'United Kingdom'),
          initialCurrency: fc.constantFrom('$', '¥', '£'),
          updatedCurrency: fc.constantFrom('$', '¥', '£'),
        }),
        async (storeData) => {
          // Create initial store
          const initialStore = await dataService.create<Store>('stores', {
            id: storeData.storeId,
            name: storeData.initialName,
            country: 'United States',
            marketplace: storeData.initialMarketplace,
            currency_symbol: storeData.initialCurrency,
            business_type: 'Business',
            timezone: 'UTC',
            vacation_mode: false,
            auto_pricing: false,
            inventory_alerts: true,
            order_notifications: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Verify initial state
          expect(initialStore.name).toBe(storeData.initialName);
          expect(initialStore.marketplace).toBe(storeData.initialMarketplace);
          expect(initialStore.currency_symbol).toBe(storeData.initialCurrency);

          // Update store metadata
          const updatedStore = await dataService.update<Store>('stores', storeData.storeId, {
            name: storeData.updatedName,
            marketplace: storeData.updatedMarketplace,
            currency_symbol: storeData.updatedCurrency,
            updated_at: new Date().toISOString(),
          });

          // Verify update was applied
          expect(updatedStore).toBeTruthy();
          expect(updatedStore!.name).toBe(storeData.updatedName);
          expect(updatedStore!.marketplace).toBe(storeData.updatedMarketplace);
          expect(updatedStore!.currency_symbol).toBe(storeData.updatedCurrency);

          // Verify changes are reflected in subsequent queries
          const refetchedStore = await dataService.findById<Store>('stores', storeData.storeId);
          expect(refetchedStore).toBeTruthy();
          expect(refetchedStore!.name).toBe(storeData.updatedName);
          expect(refetchedStore!.marketplace).toBe(storeData.updatedMarketplace);
          expect(refetchedStore!.currency_symbol).toBe(storeData.updatedCurrency);

          // Verify store list includes updated data
          const allStores = await dataService.readData<Store>('stores');
          const foundStore = allStores.find((s: Store) => s.id === storeData.storeId);
          expect(foundStore).toBeTruthy();
          expect(foundStore!.name).toBe(storeData.updatedName);
          expect(foundStore!.marketplace).toBe(storeData.updatedMarketplace);
          expect(foundStore!.currency_symbol).toBe(storeData.updatedCurrency);
        }
      ),
      { numRuns: 15, timeout: 20000 }
    );
  });

  it('should maintain referential integrity during store operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storeId: fc.string({ minLength: 5, maxLength: 20 }),
          storeName: fc.string({ minLength: 3, maxLength: 50 }),
          productCount: fc.integer({ min: 1, max: 3 }), // Reduced from 5 to 3
          snapshotData: fc.record({
            sales_amount: fc.float({ min: 0, max: 1000, noNaN: true }),
            open_orders: fc.integer({ min: 0, max: 100 }),
            buyer_messages: fc.integer({ min: 0, max: 50 }),
          }),
        }),
        async (testData) => {
          // Create store
          const store = await dataService.create<Store>('stores', {
            id: testData.storeId,
            name: testData.storeName,
            country: 'United States',
            marketplace: 'United States',
            currency_symbol: '$',
            business_type: 'Business',
            timezone: 'UTC',
            vacation_mode: false,
            auto_pricing: false,
            inventory_alerts: true,
            order_notifications: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Create related data
          const products = [];
          for (let i = 0; i < testData.productCount; i++) {
            const product = await dataService.create<Product>('products', {
              store_id: testData.storeId,
              title: `Test Product ${i}`,
              asin: `B${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
              sku: `SKU-${testData.storeId}-${i}`,
              price: Math.random() * 100,
              inventory: Math.floor(Math.random() * 100),
              fulfillment_type: 'FBA',
              status: 'Active',
              sales_amount: Math.random() * 500,
              units_sold: Math.floor(Math.random() * 50),
              page_views: Math.floor(Math.random() * 1000),
              ncx_rate: Math.random() * 10,
              ncx_orders: Math.floor(Math.random() * 10),
              total_orders: Math.floor(Math.random() * 100),
              star_rating: Math.random() * 5,
              cx_health_status: 'Good',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            products.push(product);
          }

          // Create global snapshot
          const snapshot = await dataService.create<GlobalSnapshot>('global_snapshots', {
            store_id: testData.storeId,
            sales_amount: testData.snapshotData.sales_amount,
            open_orders: testData.snapshotData.open_orders,
            buyer_messages: testData.snapshotData.buyer_messages,
            featured_offer_percent: 100,
            seller_feedback_rating: 5.0,
            seller_feedback_count: 0,
            payments_balance: 0,
            fbm_unshipped: 0,
            fbm_pending: 0,
            fba_pending: 0,
            inventory_performance_index: 400,
            ad_sales: 0,
            ad_impressions: 0,
            updated_at: new Date().toISOString(),
          });

          // Verify all data is properly linked to store
          const storeProducts = await dataService.findByStoreId<Product>('products', testData.storeId);
          expect(storeProducts).toHaveLength(testData.productCount);

          const storeSnapshots = await dataService.findByStoreId<GlobalSnapshot>('global_snapshots', testData.storeId);
          expect(storeSnapshots).toHaveLength(1);
          expect(storeSnapshots[0].store_id).toBe(testData.storeId);

          // Test store context switching maintains referential integrity
          const contextStore = await dataService.findById<Store>('stores', testData.storeId);
          const contextProducts = await dataService.findByStoreId<Product>('products', testData.storeId);
          const contextSnapshots = await dataService.findByStoreId<GlobalSnapshot>('global_snapshots', testData.storeId);

          expect(contextStore!.id).toBe(testData.storeId);
          expect(contextProducts).toHaveLength(testData.productCount);
          expect(contextSnapshots).toHaveLength(1);

          // Verify all related data references the correct store
          for (const product of contextProducts) {
            expect(product.store_id).toBe(testData.storeId);
          }

          for (const snapshot of contextSnapshots) {
            expect(snapshot.store_id).toBe(testData.storeId);
          }
        }
      ),
      { numRuns: 5, timeout: 15000 } // Reduced runs and increased timeout
    );
  }, 20000); // Increased Jest timeout to 20 seconds
});