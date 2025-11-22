import apiClient from '@/lib/api-client';
import { companyApi, allLedgerApi, stockItemApi } from '@/lib/api-client';
import { toast } from '@/lib/toast';
import type { AxiosResponse } from 'axios';

// Define response types
export interface TallyApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface CompanyDetails {
  name: string;
  gstin: string;
  state: string;
}

export interface Customer {
  id: number;
  name: string;
  gstin: string;
  state: string;
  phone: string;
  contactPerson: string;
  deliveryLocation: string;
}

export interface DetailedCustomer extends Customer {
  address: string;
  city: string;
  zipcode: string;
  country: string;
  email: string;
  contactPersonPhone?: string; // Add contact person phone number
}

export interface StockItem {
  id: number;
  name: string;
  alias?: string;
  unit?: string;
  category?: string;
  hsncode?: string;
  yarnCount?: string;
  fabricType?: string;
  // Add other fields as needed based on the actual API response
}

export class TallyService {
  // Fetch company details
  static async getCompanyDetails(): Promise<CompanyDetails> {
    try {
      const response = await companyApi.getCompanyDetails();
      
      // For now, returning mock data since we need to parse the actual response
      // In a real implementation, you would parse the response.data to extract company details
      return {
        name: "Avyyan Textiles Pvt Ltd",
        gstin: "27AABCA1234D1Z5",
        state: "Maharashtra"
      };
    } catch (error) {
      console.error('Error fetching company details:', error);
      toast.error('Server Error', 'Failed to fetch company details. Please check server connection.');
      throw error;
    }
  }

  // Fetch customer list
  static async getCustomers(): Promise<Customer[]> {
    try {
      const response: AxiosResponse<TallyApiResponse<string[]>> = await allLedgerApi.getCustomers() as AxiosResponse<TallyApiResponse<string[]>>;
      
      // Parse the response to create customer objects
      // This is a simplified implementation - you would need to adjust based on actual API response format
      if (response.data.success && response.data.data) {
        return response.data.data.map((customerName: string, index: number) => ({
          id: index + 1,
          name: customerName,
          gstin: "",
          state: "",
          phone: "",
          contactPerson: "",
          deliveryLocation: ""
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Server Error', 'Failed to fetch customers. Please check server connection.');
      throw error;
    }
  }

  // Fetch detailed customer data
  static async getDetailedCustomers(): Promise<DetailedCustomer[]> {
    try {
      const response: AxiosResponse<TallyApiResponse<any[]>> = await allLedgerApi.getCustomerData() as AxiosResponse<TallyApiResponse<any[]>>;
      
      // Parse the response to create detailed customer objects
      if (response.data.success && response.data.data) {
        return response.data.data.map((customer: any, index: number) => ({
          id: index + 1,
          name: customer.name1 || customer.name || 'Unknown Customer',
          gstin: customer.gst || '',
          state: customer.state || '',
          phone: customer.phoneno || '',
          contactPerson: customer.contactpersonname || '',
          deliveryLocation: customer.address || '',
          address: customer.address || '',
          city: customer.city || '',
          zipcode: customer.zipcode || '',
          country: customer.country || '',
          email: customer.contactpersonemail || '',
          contactPersonPhone: customer.contactpersonno || '' // Add contact person phone
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching detailed customers:', error);
      toast.error('Server Error', 'Failed to fetch detailed customer data. Please check server connection.');
      throw error;
    }
  }

  // Fetch supplier list
  static async getSuppliers(): Promise<Customer[]> {
    try {
      const response: AxiosResponse<TallyApiResponse<string[]>> = await allLedgerApi.getSuppliers() as AxiosResponse<TallyApiResponse<string[]>>;
      
      // Parse the response to create supplier objects
      // This is a simplified implementation - you would need to adjust based on actual API response format
      if (response.data.success && response.data.data) {
        return response.data.data.map((supplierName: string, index: number) => ({
          id: index + 1,
          name: supplierName,
          gstin: "",
          state: "",
          phone: "",
          contactPerson: "",
          deliveryLocation: ""
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Server Error', 'Failed to fetch suppliers. Please check server connection.');
      throw error;
    }
  }

  // Fetch stock items
  static async getStockItems(): Promise<StockItem[]> {
    try {
      const response: AxiosResponse<TallyApiResponse<StockItem[]>> = await stockItemApi.getStockItems() as AxiosResponse<TallyApiResponse<StockItem[]>>;
      
      // Parse the response to create stock item objects
      if (response.data.success && response.data.data) {
        return response.data.data.map((item, index) => ({
          id: index + 1,
          name: item.name || 'Unknown Item',
          alias: item.alias,
          unit: item.unit,
          category: item.category,
          hsncode: item.hsncode,
          yarnCount: item.yarnCount,
          fabricType: item.fabricType
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Server Error', 'Failed to fetch stock items. Please check server connection.');
      throw error;
    }
  }
}