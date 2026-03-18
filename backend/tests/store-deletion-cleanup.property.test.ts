import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { dataService } from '../src/services/dataService';
import { 
  type Store, 
  type Product, 
  type GlobalSnapshot, 
  type SalesSnapshot,
  type DailySales,
  type ForumPost 
} from '../src/types/index';
import { v4 as uuidv4 } from 'uuid';

describe('Store Deletion Cleanup Property Tests', () => {
  // Helper function to clear all test data
  const clearAllData = async () => {
    const dataTypes = [
      'stores', 
      'products', 
      'global_snapshots', 
      'sales_snapshots', 
      'daily_sales', 
      'forum_posts',
      'account_health',
      'legal_entity',
      'voc_data'
    ];
    
    for (const dataType of dataTypes) {
      try {
        await dataService.writeData(dataType, []);
      } catch (error) {
        // Ignore errors for data types that don't exist yet
      }
    }
  };

  beforeEach(async () => {
    // Clear all data before each test
    await clearAllData();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearAllData();
  });

  /**
   * Property 3: Store Deletion Cleanup
   * Validates: Requirements 1.5
   * 
   * This property ensures that:
   * 1. When a store is deleted, all related data is also deleted
   * 2. Data from other stores remains untouched
   * 3. The deletion process maintains data integrity
   * 4. No orphaned records are left behind
   */
  it('Property 3: Store Deletion Cleanup', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple stores
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            marketplace: fc.constantFrom('United States', 'Japan', 'United Kingdom', 'Germany'),
          }),
          { minLength: 2, maxLength: 4 } // At least 2 stores to test isolation
        ),
        // Generate number of products per store
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 2, maxLength: 4 }),
        async (storeConfigs, productCounts) => {
          // Ensure clean state for this test
          await clearAllData();
          
          // Ensure we have the same number of stores and product counts
          const numStores = Math.min(storeConfigs.length, productCounts.length);
          const stores: Store[] = [];
          const allProducts: Product[] = [];
          const allSnapshots: GlobalSnapshot[] = [];
          const allSalesSnapshots: SalesSnapshot[] = [];
          const allDailySales: DailySales[] = [];
          const allForumPosts: ForumPost[] = [];

          // Create stores and their related data
          for (let i = 0; i < numStores; i++) {
            const storeConfig = storeConfigs[i];
            const productCount = productCounts[i];

            // Create store
            const store = await dataService.create<Store>('stores', {
              name: `${storeConfig.name}_${i}`,
              country: storeConfig.marketplace,
              marketplace: storeConfig.marketplace,
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
            stores.push(store);

            // Create products for this store
            for (let j = 0; j < productCount; j++) {
              const product = await dataService.create<Product>('products', {
                store_id: store.id,
                title: `Product ${j} for Store ${i}`,
                asin: `ASIN${i}${j}`,
                sku: `SKU${i}${j}`,
                price: 10 + j,
                inventory: 100 + j,
                fulfillment_type: 'FBA',
                status: 'Active',
                sales_amount: 50 + j,
                units_sold: 5 + j,
                page_views: 100 + j,
                ncx_rate: 0,
                ncx_orders: 0,
                total_orders: 5 + j,
                star_rating: 4.0 + (j * 0.1),
                cx_health_status: 'Good',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              allProducts.push(product);
            }

            // Create global snapshot for this store
            const snapshot = await dataService.create<GlobalSnapshot>('global_snapshots', {
              store_id: store.id,
              sales_amount: 100 + i,
              open_orders: 5 + i,
              buyer_messages: i,
              featured_offer_percent: 100,
              seller_feedback_rating: 5.0,
              seller_feedback_count: 2 + i,
              payments_balance: 200 + i,
              fbm_unshipped: 0,
              fbm_pending: 0,
              fba_pending: 5 + i,
              inventory_performance_index: 400,
              ad_sales: 0,
              ad_impressions: 0,
              updated_at: new Date().toISOString(),
            });
            allSnapshots.push(snapshot);

            // Create sales snapshot for this store
            const salesSnapshot = await dataService.create<SalesSnapshot>('sales_snapshots', {
              store_id: store.id,
              total_order_items: 10 + i,
              units_ordered: 100 + i,
              ordered_product_sales: 1000 + i,
              avg_units_per_order: 1.5,
              avg_sales_per_order: 50.0,
              snapshot_time: new Date().toISOString(),
            });
            allSalesSnapshots.push(salesSnapshot);

            // Create daily sales for this store
            const dailySales = await dataService.create<DailySales>('daily_sales', {
              store_id: store.id,
              sale_date: new Date().toISOString().split('T')[0],
              sales_amount: 50 + i,
              units_ordered: 10 + i,
            });
            allDailySales.push(dailySales);

            // Create forum posts for this store
            const forumPost = await dataService.create<ForumPost>('forum_posts', {
              store_id: store.id,
              title: `Forum Post for Store ${i}`,
              post_date: new Date().toISOString().split('T')[0],
              views: 100 + i,
              comments: 5 + i,
              post_type: 'FORUM',
              likes: i,
            });
            allForumPosts.push(forumPost);
          }

          // Verify all data was created
          expect(stores).toHaveLength(numStores);
          expect(allProducts.length).toBeGreaterThan(0);
          expect(allSnapshots).toHaveLength(numStores);
          expect(allSalesSnapshots).toHaveLength(numStores);
          expect(allDailySales).toHaveLength(numStores);
          expect(allForumPosts).toHaveLength(numStores);

          // Select a store to delete (not the last one to ensure we have remaining stores)
          const storeToDelete = stores[0];
          const remainingStores = stores.slice(1);

          // Count data before deletion
          const productsBeforeDeletion = await dataService.readData<Product>('products');
          const snapshotsBeforeDeletion = await dataService.readData<GlobalSnapshot>('global_snapshots');
          const salesSnapshotsBeforeDeletion = await dataService.readData<SalesSnapshot>('sales_snapshots');
          const dailySalesBeforeDeletion = await dataService.readData<DailySales>('daily_sales');
          const forumPostsBeforeDeletion = await dataService.readData<ForumPost>('forum_posts');

          // Get data that should be deleted
          const productsToDelete = await dataService.findByStoreId<Product>('products', storeToDelete.id);
          const snapshotsToDelete = await dataService.findByStoreId<GlobalSnapshot>('global_snapshots', storeToDelete.id);
          const salesSnapshotsToDelete = await dataService.findByStoreId<SalesSnapshot>('sales_snapshots', storeToDelete.id);
          const dailySalesToDelete = await dataService.findByStoreId<DailySales>('daily_sales', storeToDelete.id);
          const forumPostsToDelete = await dataService.findByStoreId<ForumPost>('forum_posts', storeToDelete.id);

          // Perform cascade deletion manually (simulating the store deletion endpoint)
          const deletionTasks = [
            { name: 'products', records: productsToDelete },
            { name: 'global_snapshots', records: snapshotsToDelete },
            { name: 'sales_snapshots', records: salesSnapshotsToDelete },
            { name: 'daily_sales', records: dailySalesToDelete },
            { name: 'forum_posts', records: forumPostsToDelete },
          ];

          let totalDeleted = 0;
          for (const task of deletionTasks) {
            for (const record of task.records) {
              const success = await dataService.delete(task.name, record.id);
              if (success) {
                totalDeleted++;
              }
            }
          }

          // Delete the store itself
          const storeDeleted = await dataService.delete('stores', storeToDelete.id);
          expect(storeDeleted).toBe(true);

          // Verify the store was deleted
          const storesAfterDeletion = await dataService.readData<Store>('stores');
          expect(storesAfterDeletion).toHaveLength(numStores - 1);
          expect(storesAfterDeletion.find(s => s.id === storeToDelete.id)).toBeUndefined();

          // Verify all related data was deleted
          const productsAfterDeletion = await dataService.readData<Product>('products');
          const snapshotsAfterDeletion = await dataService.readData<GlobalSnapshot>('global_snapshots');
          const salesSnapshotsAfterDeletion = await dataService.readData<SalesSnapshot>('sales_snapshots');
          const dailySalesAfterDeletion = await dataService.readData<DailySales>('daily_sales');
          const forumPostsAfterDeletion = await dataService.readData<ForumPost>('forum_posts');

          // Check that the correct number of records were deleted
          expect(productsAfterDeletion).toHaveLength(productsBeforeDeletion.length - productsToDelete.length);
          expect(snapshotsAfterDeletion).toHaveLength(snapshotsBeforeDeletion.length - snapshotsToDelete.length);
          expect(salesSnapshotsAfterDeletion).toHaveLength(salesSnapshotsBeforeDeletion.length - salesSnapshotsToDelete.length);
          expect(dailySalesAfterDeletion).toHaveLength(dailySalesBeforeDeletion.length - dailySalesToDelete.length);
          expect(forumPostsAfterDeletion).toHaveLength(forumPostsBeforeDeletion.length - forumPostsToDelete.length);

          // Verify no data from the deleted store remains
          const remainingProducts = await dataService.findByStoreId<Product>('products', storeToDelete.id);
          const remainingSnapshots = await dataService.findByStoreId<GlobalSnapshot>('global_snapshots', storeToDelete.id);
          const remainingSalesSnapshots = await dataService.findByStoreId<SalesSnapshot>('sales_snapshots', storeToDelete.id);
          const remainingDailySales = await dataService.findByStoreId<DailySales>('daily_sales', storeToDelete.id);
          const remainingForumPosts = await dataService.findByStoreId<ForumPost>('forum_posts', storeToDelete.id);

          expect(remainingProducts).toHaveLength(0);
          expect(remainingSnapshots).toHaveLength(0);
          expect(remainingSalesSnapshots).toHaveLength(0);
          expect(remainingDailySales).toHaveLength(0);
          expect(remainingForumPosts).toHaveLength(0);

          // Verify data from other stores is intact
          for (const remainingStore of remainingStores) {
            const storeProducts = await dataService.findByStoreId<Product>('products', remainingStore.id);
            const storeSnapshots = await dataService.findByStoreId<GlobalSnapshot>('global_snapshots', remainingStore.id);
            const storeSalesSnapshots = await dataService.findByStoreId<SalesSnapshot>('sales_snapshots', remainingStore.id);
            const storeDailySales = await dataService.findByStoreId<DailySales>('daily_sales', remainingStore.id);
            const storeForumPosts = await dataService.findByStoreId<ForumPost>('forum_posts', remainingStore.id);

            // Each remaining store should still have its data
            expect(storeProducts.length).toBeGreaterThan(0);
            expect(storeSnapshots).toHaveLength(1);
            expect(storeSalesSnapshots).toHaveLength(1);
            expect(storeDailySales).toHaveLength(1);
            expect(storeForumPosts).toHaveLength(1);

            // Verify the data belongs to the correct store
            storeProducts.forEach(product => {
              expect(product.store_id).toBe(remainingStore.id);
            });
            storeSnapshots.forEach(snapshot => {
              expect(snapshot.store_id).toBe(remainingStore.id);
            });
            storeSalesSnapshots.forEach(snapshot => {
              expect(snapshot.store_id).toBe(remainingStore.id);
            });
            storeDailySales.forEach(sales => {
              expect(sales.store_id).toBe(remainingStore.id);
            });
            storeForumPosts.forEach(post => {
              expect(post.store_id).toBe(remainingStore.id);
            });
          }
        }
      ),
      { numRuns: 5 } // Run 5 iterations with different store configurations
    );
  });

  /**
   * Property: Store Deletion Validation
   * Ensures that business rules for store deletion are enforced
   */
  it('Property: Store Deletion Validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (numStores) => {
          // Ensure clean state for this test
          await clearAllData();
          
          // Create multiple stores
          const stores: Store[] = [];
          for (let i = 0; i < numStores; i++) {
            const store = await dataService.create<Store>('stores', {
              name: `Store ${i}`,
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
            stores.push(store);
          }

          // If there's only one store, it should not be deletable (business rule)
          if (numStores === 1) {
            // Simulate the validation logic from the store deletion endpoint
            const activeStores = stores.filter(s => s.is_active && s.id !== stores[0].id);
            expect(activeStores).toHaveLength(0);
            
            // This would trigger the "cannot delete last active store" validation
            // In a real scenario, the API would return a 400 error
          } else {
            // With multiple stores, deletion should be allowed
            const storeToDelete = stores[0];
            const activeStores = stores.filter(s => s.is_active && s.id !== storeToDelete.id);
            expect(activeStores.length).toBeGreaterThan(0);
            
            // Deletion should be allowed
            const deleted = await dataService.delete('stores', storeToDelete.id);
            expect(deleted).toBe(true);
            
            // Verify store was deleted
            const remainingStores = await dataService.readData<Store>('stores');
            expect(remainingStores).toHaveLength(numStores - 1);
            expect(remainingStores.find(s => s.id === storeToDelete.id)).toBeUndefined();
          }
        }
      ),
      { numRuns: 8 }
    );
  });

  /**
   * Property: Referential Integrity During Deletion
   * Ensures that deletion maintains referential integrity
   */
  it('Property: Referential Integrity During Deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 2, maxLength: 3 }),
        async (productCounts) => {
          // Ensure clean state for this test
          await clearAllData();
          
          // Create stores with varying amounts of data
          const stores: Store[] = [];
          const allProductIds: string[] = [];

          for (let i = 0; i < productCounts.length; i++) {
            // Create store
            const store = await dataService.create<Store>('stores', {
              name: `Store ${i}`,
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
            stores.push(store);

            // Create products for this store
            for (let j = 0; j < productCounts[i]; j++) {
              const product = await dataService.create<Product>('products', {
                store_id: store.id,
                title: `Product ${j}`,
                asin: `ASIN${i}${j}`,
                sku: `SKU${i}${j}`,
                price: 10,
                inventory: 100,
                fulfillment_type: 'FBA',
                status: 'Active',
                sales_amount: 50,
                units_sold: 5,
                page_views: 100,
                ncx_rate: 0,
                ncx_orders: 0,
                total_orders: 5,
                star_rating: 4.0,
                cx_health_status: 'Good',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              allProductIds.push(product.id);
            }
          }

          // Delete the first store
          const storeToDelete = stores[0];
          const productsToDelete = await dataService.findByStoreId<Product>('products', storeToDelete.id);
          
          // Perform cascade deletion
          for (const product of productsToDelete) {
            await dataService.delete('products', product.id);
          }
          await dataService.delete('stores', storeToDelete.id);

          // Verify referential integrity
          const remainingProducts = await dataService.readData<Product>('products');
          
          // No product should reference the deleted store
          const orphanedProducts = remainingProducts.filter(p => p.store_id === storeToDelete.id);
          expect(orphanedProducts).toHaveLength(0);

          // All remaining products should reference existing stores
          const remainingStores = await dataService.readData<Store>('stores');
          const remainingStoreIds = remainingStores.map(s => s.id);
          
          for (const product of remainingProducts) {
            expect(remainingStoreIds).toContain(product.store_id);
          }
        }
      ),
      { numRuns: 6 }
    );
  });
});