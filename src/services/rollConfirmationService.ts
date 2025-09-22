import apiClient from '@/lib/api-client';
import type { 
  RollConfirmationRequestDto,
  RollConfirmationResponseDto
} from '@/types/api-types';

export class RollConfirmationService {
  // POST /api/rollconfirmation - Create a new roll confirmation
  static async createRollConfirmation(data: RollConfirmationRequestDto): Promise<RollConfirmationResponseDto> {
    try {
      const response = await apiClient.post('/rollconfirmation', data);
      return response.data;
    } catch (error) {
      console.error('Error creating roll confirmation:', error);
      throw error;
    }
  }

  // GET /api/rollconfirmation/{id} - Get roll confirmation by ID
  static async getRollConfirmationById(id: number): Promise<RollConfirmationResponseDto> {
    try {
      const response = await apiClient.get(`/rollconfirmation/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching roll confirmation by ID:', error);
      throw error;
    }
  }

  // GET /api/rollconfirmation/by-allot-id/{allotId} - Get roll confirmations by AllotId
  static async getRollConfirmationsByAllotId(allotId: string): Promise<RollConfirmationResponseDto[]> {
    try {
      const response = await apiClient.get(`/rollconfirmation/by-allot-id/${allotId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching roll confirmations by AllotId:', error);
      throw error;
    }
  }
}