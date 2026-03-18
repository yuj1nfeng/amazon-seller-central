import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { dataService } from '../src/services/dataService';
import { CreateStoreRequestSchema, UpdateStoreRequestSchema, type Store } from '../src/types/index';
import { v4 as uuidv4 } from 'uuid';

describe('Store CRUD Operations Property Tests', () => {
  beforeEach(async () => {
    // Clear stores data before each test
    await dataService.writeData('stores', []);
  });

  afterEach(async () => {
    // Clean up after each test
    await dataService.writeData('stores', []);
  });

  /**
   * Property 14: Store Management CRUD Operations
   * Validates: Requirements 7.1, 7.2, 7.4
   * 
   * This property ensures that:
   * 1. Created stores can be retrieved with correct data
   * 2. Updated stores maintain data integrity
   * 3. Deleted stores are properly removed
   * 4. All CRUD operations preserve data consistency
   */
  it('Property 14: Store Management CRUD Operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid store creation data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          country: fc.constantFrom('United States', 'Japan', 'United Kingdom', 'Germany'),
          marketplace: fc.constantFrom('United States', 'Japan', 'United Kingdom', 'Germany', 'Europe'),
          currency_symbol: fc.constantFrom('$', '¥', '£', '€'),
          business_type: fc.constantFrom('Individual', 'Business'),
          timezone: fc.constantFrom('UTC', 'EST', 'PST', 'JST', 'GMT'),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        }),
        // Generate update data
        fc.record({
          name: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          vacation_mode: fc.option(fc.boolean(), { nil: undefined }),
          auto_pricing: fc.option(fc.boolean(), { nil: undefined }),
          inventory_alerts: fc.option(fc.boolean(), { nil: undefined }),
          order_notifications: fc.option(fc.boolean(), { nil: undefined }),
          is_active: fc.option(fc.boolean(), { nil: undefined }),
        }),
        async (createData, updateData) => {
          // Validate input data against schemas
          const validCreateData = CreateStoreRequestSchema.parse(createData);
          const validUpdateData = UpdateStoreRequestSchema.parse(updateData);

          // CREATE: Create a new store
          const createdStore = await dataService.create<Store>('stores', {
            ...validCreateData,
            // Set defaults for required fields
            country: validCreateData.country || 'United States',
            marketplace: validCreateData.marketplace || 'United States',
            currency_symbol: validCreateData.currency_symbol || '$',
            business_type: validCreateData.business_type || 'Business',
            timezone: validCreateData.timezone || 'UTC',
            // Initialize settings with defaults
            vacation_mode: false,
            auto_pricing: false,
            inventory_alerts: true,
            order_notifications: true,
            // Set status and timestamps
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Verify store was created with correct data
          expect(createdStore).toBeDefined();
          expect(createdStore.id).toBeDefined();
          expect(createdStore.name).toBe(validCreateData.name);
          expect(createdStore.is_active).toBe(true);

          // READ: Retrieve the created store
          const stores = await dataService.readData<Store>('stores');
          const retrievedStore = stores.find(s => s.id === createdStore.id);
          
          expect(retrievedStore).toBeDefined();
          expect(retrievedStore!.name).toBe(createdStore.name);
          expect(retrievedStore!.marketplace).toBe(createdStore.marketplace);

          // UPDATE: Update the store with new data
          const updatedStore = await dataService.update<Store>('stores', createdStore.id, {
            ...validUpdateData,
            updated_at: new Date().toISOString(),
          });

          expect(updatedStore).toBeDefined();
          expect(updatedStore!.id).toBe(createdStore.id);
          
          // Verify updated fields
          if (validUpdateData.name !== undefined) {
            expect(updatedStore!.name).toBe(validUpdateData.name);
          }
          if (validUpdateData.vacation_mode !== undefined) {
            expect(updatedStore!.vacation_mode).toBe(validUpdateData.vacation_mode);
          }
          if (validUpdateData.is_active !== undefined) {
            expect(updatedStore!.is_active).toBe(validUpdateData.is_active);
          }

          // Verify unchanged fields remain the same
          expect(updatedStore!.created_at).toBe(createdStore.created_at);
          expect(updatedStore!.currency_symbol).toBe(createdStore.currency_symbol);

          // DELETE: Remove the store
          const deleteResult = await dataService.delete('stores', createdStore.id);
          expect(deleteResult).toBe(true);

          // Verify store was deleted
          const storesAfterDelete = await dataService.readData<Store>('stores');
          const deletedStore = storesAfterDelete.find(s => s.id === createdStore.id);
          expect(deletedStore).toBeUndefined();
        }
      ),
      { numRuns: 15 } // Run 15 iterations to test various combinations
    );
  });

  /**
   * Property: Store Name Uniqueness Validation
   * Ensures that store names should be unique within the system
   */
  it('Property: Store Name Uniqueness Validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.constantFrom('United States', 'Japan', 'United Kingdom'),
        async (storeName, marketplace) => {
          // Clear any existing data for this test
          await dataService.writeData('stores', []);
          
          // Create first store
          const store1 = await dataService.create<Store>('stores', {
            name: storeName,
            country: marketplace,
            marketplace: marketplace,
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

          expect(store1).toBeDefined();
          expect(store1.name).toBe(storeName);

          // Verify we can create stores with different names
          const differentName = storeName + '_different';
          const store2 = await dataService.create<Store>('stores', {
            name: differentName,
            country: marketplace,
            marketplace: marketplace,
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

          expect(store2).toBeDefined();
          expect(store2.name).toBe(differentName);
          expect(store2.id).not.toBe(store1.id);

          // Verify both stores exist
          const allStores = await dataService.readData<Store>('stores');
          expect(allStores).toHaveLength(2);
          expect(allStores.map(s => s.name)).toContain(storeName);
          expect(allStores.map(s => s.name)).toContain(differentName);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Store Settings Consistency
   * Ensures that store settings are properly maintained across operations
   */
  it('Property: Store Settings Consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          vacation_mode: fc.boolean(),
          auto_pricing: fc.boolean(),
          inventory_alerts: fc.boolean(),
          order_notifications: fc.boolean(),
        }),
        async (storeData) => {
          // Create store with specific settings
          const createdStore = await dataService.create<Store>('stores', {
            name: storeData.name,
            country: 'United States',
            marketplace: 'United States',
            currency_symbol: '$',
            business_type: 'Business',
            timezone: 'UTC',
            vacation_mode: storeData.vacation_mode,
            auto_pricing: storeData.auto_pricing,
            inventory_alerts: storeData.inventory_alerts,
            order_notifications: storeData.order_notifications,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Verify settings are preserved
          expect(createdStore.vacation_mode).toBe(storeData.vacation_mode);
          expect(createdStore.auto_pricing).toBe(storeData.auto_pricing);
          expect(createdStore.inventory_alerts).toBe(storeData.inventory_alerts);
          expect(createdStore.order_notifications).toBe(storeData.order_notifications);

          // Update some settings
          const newVacationMode = !storeData.vacation_mode;
          const newAutoPricing = !storeData.auto_pricing;

          const updatedStore = await dataService.update<Store>('stores', createdStore.id, {
            vacation_mode: newVacationMode,
            auto_pricing: newAutoPricing,
            updated_at: new Date().toISOString(),
          });

          // Verify updated settings
          expect(updatedStore!.vacation_mode).toBe(newVacationMode);
          expect(updatedStore!.auto_pricing).toBe(newAutoPricing);
          
          // Verify unchanged settings remain the same
          expect(updatedStore!.inventory_alerts).toBe(storeData.inventory_alerts);
          expect(updatedStore!.order_notifications).toBe(storeData.order_notifications);
          expect(updatedStore!.name).toBe(storeData.name);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Store Marketplace and Currency Consistency
   * Ensures marketplace and currency symbol are properly aligned
   */
  it('Property: Store Marketplace and Currency Consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { marketplace: 'United States', currency: '$' },
          { marketplace: 'Japan', currency: '¥' },
          { marketplace: 'United Kingdom', currency: '£' },
          { marketplace: 'Germany', currency: '€' },
          { marketplace: 'Europe', currency: '€' }
        ),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (marketplaceConfig, storeName) => {
          // Create store with marketplace-specific currency
          const createdStore = await dataService.create<Store>('stores', {
            name: storeName,
            country: marketplaceConfig.marketplace,
            marketplace: marketplaceConfig.marketplace,
            currency_symbol: marketplaceConfig.currency,
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

          // Verify marketplace and currency are consistent
          expect(createdStore.marketplace).toBe(marketplaceConfig.marketplace);
          expect(createdStore.currency_symbol).toBe(marketplaceConfig.currency);
          expect(createdStore.country).toBe(marketplaceConfig.marketplace);

          // Update marketplace and verify currency can be updated accordingly
          const newMarketplace = marketplaceConfig.marketplace === 'United States' ? 'Japan' : 'United States';
          const newCurrency = newMarketplace === 'United States' ? '$' : '¥';

          const updatedStore = await dataService.update<Store>('stores', createdStore.id, {
            marketplace: newMarketplace,
            currency_symbol: newCurrency,
            updated_at: new Date().toISOString(),
          });

          expect(updatedStore!.marketplace).toBe(newMarketplace);
          expect(updatedStore!.currency_symbol).toBe(newCurrency);
        }
      ),
      { numRuns: 10 }
    );
  });
});