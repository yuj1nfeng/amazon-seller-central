import express from 'express';
import { dataService } from '../services/dataService';
import {
  SalesSnapshotSchema,
  DailySalesSchema,
  type SalesSnapshot,
  type DailySales,
  type ApiResponse,
  type SalesDateRange
} from '../types/index';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

// GET /api/sales?store_id=:storeId - Get sales data by store (for admin compatibility)
router.get('/', asyncHandler(async (req, res) => {
  const { store_id } = req.query;

  if (!store_id) {
    throw createError('store_id query parameter is required', 400);
  }

  // Redirect to snapshot endpoint for now
  let snapshots = await dataService.findByStoreId<SalesSnapshot>('sales_snapshots', store_id as string);
  let snapshot = snapshots[0];

  // Create default snapshot if none exists
  if (!snapshot) {
    snapshot = await dataService.create<SalesSnapshot>('sales_snapshots', {
      store_id: store_id as string,
      total_order_items: 248,
      units_ordered: 192260,
      ordered_product_sales: 18657478,
      avg_units_per_order: 1.14,
      avg_sales_per_order: 110.29,
      snapshot_time: new Date().toISOString(),
    });
  }

  const response: ApiResponse<SalesSnapshot> = {
    success: true,
    data: snapshot,
  };

  res.json(response);
}));

// GET /api/sales/snapshot/:storeId - Get sales snapshot
router.get('/snapshot/:storeId', asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  let snapshots = await dataService.findByStoreId<SalesSnapshot>('sales_snapshots', storeId);
  let snapshot = snapshots[0];

  // Create default snapshot if none exists
  if (!snapshot) {
    snapshot = await dataService.create<SalesSnapshot>('sales_snapshots', {
      store_id: storeId,
      total_order_items: 248,
      units_ordered: 192260,
      ordered_product_sales: 18657478,
      avg_units_per_order: 1.14,
      avg_sales_per_order: 110.29,
      snapshot_time: new Date().toISOString(),
    });
  }

  const response: ApiResponse<SalesSnapshot> = {
    success: true,
    data: snapshot,
  };

  res.json(response);
}));

// PUT /api/sales/snapshot/:storeId - Update sales snapshot
router.put('/snapshot/:storeId', asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  // Parse the request body to extract fields
  const {
    total_order_items,
    units_ordered,
    ordered_product_sales,
    // New fields that should be calculated
    avg_units_per_order_item,
    avg_sales_per_order_item,
    ...otherFields
  } = req.body;

  // Calculate derived values for new fields if the base values are provided
  const calculatedAvgUnitsPerOrderItem = total_order_items && total_order_items > 0
    ? total_order_items / units_ordered
    : 0;

  const calculatedAvgSalesPerOrderItem = total_order_items && total_order_items > 0
    ? ordered_product_sales / total_order_items
    : 0;

  // Prepare update data with calculated values
  const updateData = {
    ...otherFields,
    total_order_items: parseInt(total_order_items) || 0,
    units_ordered: parseInt(units_ordered) || 0,
    ordered_product_sales: parseFloat(ordered_product_sales) || 0,
    avg_units_per_order: calculatedAvgUnitsPerOrderItem,
    avg_sales_per_order: calculatedAvgSalesPerOrderItem,
    // Include calculated values for the new fields
    avg_units_per_order_item: calculatedAvgUnitsPerOrderItem,
    avg_sales_per_order_item: calculatedAvgSalesPerOrderItem,
    snapshot_time: new Date().toISOString(),
  };

  // Use Zod schema for validation
  const validatedUpdateData = SalesSnapshotSchema.partial().parse(updateData);

  let snapshots = await dataService.findByStoreId<SalesSnapshot>('sales_snapshots', storeId);
  let snapshot = snapshots[0];

  if (!snapshot) {
    // Create new snapshot with calculated values
    snapshot = await dataService.create<SalesSnapshot>('sales_snapshots', {
      store_id: storeId,
      total_order_items: validatedUpdateData.total_order_items || 0,
      units_ordered: validatedUpdateData.units_ordered || 0,
      ordered_product_sales: validatedUpdateData.ordered_product_sales || 0,
      avg_units_per_order: validatedUpdateData.avg_units_per_order || 0,
      avg_sales_per_order: validatedUpdateData.avg_sales_per_order || 0,
      // Add the new calculated fields
      // avg_units_per_order_item: calculatedAvgUnitsPerOrderItem,
      // avg_sales_per_order_item: calculatedAvgSalesPerOrderItem,
      snapshot_time: new Date().toISOString(),
    });
  } else {
    // Update existing snapshot
    const updatedSnapshot = await dataService.update<SalesSnapshot>('sales_snapshots', snapshot.id, validatedUpdateData);
    if (!updatedSnapshot) {
      throw createError('Failed to update sales snapshot', 500);
    }
    snapshot = updatedSnapshot;
  }

  if (!snapshot) {
    throw createError('Failed to update sales snapshot', 500);
  }

  const response: ApiResponse<SalesSnapshot> = {
    success: true,
    data: snapshot,
    message: 'Sales snapshot updated successfully',
  };

  res.json(response);
}));

// GET /api/sales/daily/:storeId - Get daily sales data
router.get('/daily/:storeId', asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { startDate, endDate } = req.query as unknown as SalesDateRange;

  let dailySales = await dataService.findByStoreId<DailySales>('daily_sales', storeId);

  // Filter by date range if provided
  if (startDate && endDate) {
    dailySales = dailySales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });
  }

  // Sort by date
  dailySales.sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());

  const response: ApiResponse<DailySales[]> = {
    success: true,
    data: dailySales,
  };

  res.json(response);
}));

// POST /api/sales/generate-daily/:storeId - Generate daily sales data
router.post('/generate-daily/:storeId', asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { startDate, endDate, totalSales, totalUnits, volatility = 0.3 } = req.body;

  if (!startDate || !endDate || !totalSales || !totalUnits) {
    throw createError('Missing required parameters: startDate, endDate, totalSales, totalUnits', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Clear existing data for this date range
  const existingData = await dataService.findByStoreId<DailySales>('daily_sales', storeId);
  const filteredData = existingData.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    return saleDate < start || saleDate > end;
  });

  // Generate new daily data
  const avgSales = totalSales / days;
  const avgUnits = totalUnits / days;
  const generatedData: DailySales[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    // Add some randomness based on volatility
    const salesMultiplier = 1 + (Math.random() - 0.5) * volatility;
    const unitsMultiplier = 1 + (Math.random() - 0.5) * volatility;

    const dailySale = await dataService.create<DailySales>('daily_sales', {
      store_id: storeId,
      sale_date: date.toISOString().split('T')[0],
      sales_amount: Math.round(avgSales * salesMultiplier),
      units_ordered: Math.round(avgUnits * unitsMultiplier),
    });

    generatedData.push(dailySale);
  }

  // Save all data back
  const allData = [...filteredData, ...generatedData];
  await dataService.writeData('daily_sales', allData);

  const response: ApiResponse<DailySales[]> = {
    success: true,
    data: generatedData,
    message: `Generated ${generatedData.length} days of sales data`,
  };

  res.json(response);
}));

// GET /api/sales/chart-data/:storeId - Get formatted chart data
router.get('/chart-data/:storeId', asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { startDate, endDate } = req.query as unknown as SalesDateRange;

  let dailySales = await dataService.findByStoreId<DailySales>('daily_sales', storeId);

  // Filter by date range if provided
  if (startDate && endDate) {
    dailySales = dailySales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });
  }

  // Sort by date and format for charts
  const chartData = dailySales
    .sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime())
    .map(sale => ({
      date: sale.sale_date,
      units: sale.units_ordered,
      sales: sale.sales_amount,
      // Generate comparison data (mock last year data)
      lastYearUnits: Math.round(sale.units_ordered * (0.9 + Math.random() * 0.2)),
      lastYearSales: Math.round(sale.sales_amount * (0.9 + Math.random() * 0.2)),
    }));

  const response: ApiResponse = {
    success: true,
    data: chartData,
  };

  res.json(response);
}));


export = router;