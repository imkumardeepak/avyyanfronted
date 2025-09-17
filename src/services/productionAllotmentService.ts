import apiClient from '@/lib/api-client';
import { productionAllotmentApi } from '@/lib/api-client';
import type { 
  CreateProductionAllotmentRequest,
  ProductionAllotmentResponseDto
} from '@/types/api-types';

export class ProductionAllotmentService {
  // GET /api/productionallotment - Get all production allotments
  static async getAllProductionAllotments(): Promise<ProductionAllotmentResponseDto[]> {
    try {
      const response = await productionAllotmentApi.getAllProductionAllotments();
      return response.data;
    } catch (error) {
      console.error('Error fetching production allotments:', error);
      throw error;
    }
  }

  // GET /api/productionallotment/next-serial-number - Get next serial number
  static async getNextSerialNumber(): Promise<string> {
    try {
      const response = await apiClient.get('/productionallotment/next-serial-number');
      return response.data;
    } catch (error) {
      console.error('Error fetching next serial number:', error);
      throw error;
    }
  }

  // POST /api/productionallotment - Create a new production allotment
  static async createProductionAllotment(data: CreateProductionAllotmentRequest): Promise<{ success: boolean; allotmentId: string; productionAllotmentId: number }> {
    try {
      const response = await apiClient.post('/productionallotment', data);
      return response.data;
    } catch (error) {
      console.error('Error creating production allotment:', error);
      throw error;
    }
  }
}