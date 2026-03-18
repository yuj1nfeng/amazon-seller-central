// Test setup file
import { dataService } from '../src/services/dataService';

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Any global cleanup can go here
});

// Helper function to clean up test data
export const cleanupTestData = async (collections: string[], storeIds: string[]) => {
  for (const collection of collections) {
    for (const storeId of storeIds) {
      await dataService.deleteAllStoreData(collection, storeId);
    }
  }
};

// Helper function to generate test store IDs
export const generateTestStoreId = (prefix: string = 'test-store') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};