import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DispatchPlanningDto, SalesOrderDto, SalesOrderItemDto } from '@/types/api-types';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: 120,
  },
  table: {
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
  },
  tableColHeader: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableCol: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    borderRightStyle: 'solid',
  },
  lastTableCol: {
    flex: 1,
    padding: 5,
    borderRightWidth: 0,
  },
  rightAlign: {
    textAlign: 'right',
  },
  centerAlign: {
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    paddingTop: 10,
    fontSize: 8,
  },
});

// Helper function to parse rate as number
const parseRate = (rate: string): number => {
  if (!rate) return 0;
  // Remove any non-numeric characters except decimal point
  const cleanedRate = rate.replace(/[^\d.]/g, '');
  return parseFloat(cleanedRate) || 0;
};

// Helper function to calculate total amount
const calculateTotalAmount = (rate: number, quantity: number): number => {
  return rate * quantity;
};

// Interface for invoice data
interface InvoiceData {
  dispatchOrderId: string;
  customerName: string;
  dispatchDate: string;
  lots: DispatchPlanningDto[];
  salesOrders: Record<number, SalesOrderDto>;
  totalGrossWeight: number;
  totalNetWeight: number;
}

// Interface for grouped lot data
interface GroupedLot {
  lotNo: string;
  salesOrderId: number;
  salesOrderItemId: number;
  salesOrderItem?: SalesOrderItemDto;
  totalQuantity: number;
  totalNetWeight: number;
  rate: number;
  totalAmount: number;
}

const InvoicePDF: React.FC<{ invoiceData: InvoiceData }> = ({ invoiceData }) => {
  // Group lots by sales order and item
  const groupedLots: GroupedLot[] = [];
  
  // Group the lots by sales order item
  const lotGroups: Record<string, DispatchPlanningDto[]> = {};
  invoiceData.lots.forEach(lot => {
    const key = `${lot.salesOrderId}-${lot.salesOrderItemId}`;
    if (!lotGroups[key]) {
      lotGroups[key] = [];
    }
    lotGroups[key].push(lot);
  });
  
  // Process each group to calculate totals
  Object.values(lotGroups).forEach(group => {
    if (group.length > 0) {
      const firstLot = group[0];
      const salesOrder = invoiceData.salesOrders[firstLot.salesOrderId];
      const salesOrderItem = salesOrder?.items?.find(item => item.id === firstLot.salesOrderItemId);
      
      const totalQuantity = group.reduce((sum, lot) => sum + lot.totalDispatchedRolls, 0);
      const totalNetWeight = group.reduce((sum, lot) => sum + (lot.totalNetWeight || 0), 0);
      const rate = salesOrderItem ? parseRate(salesOrderItem.rate) : 0;
      const totalAmount = calculateTotalAmount(rate, totalNetWeight);
      
      groupedLots.push({
        lotNo: firstLot.lotNo,
        salesOrderId: firstLot.salesOrderId,
        salesOrderItemId: firstLot.salesOrderItemId,
        salesOrderItem,
        totalQuantity,
        totalNetWeight,
        rate,
        totalAmount
      });
    }
  });
  
  // Calculate grand total
  const grandTotal = groupedLots.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text>Dispatch Order ID: {invoiceData.dispatchOrderId}</Text>
          <Text>Customer: {invoiceData.customerName}</Text>
          <Text>Date: {new Date(invoiceData.dispatchDate).toLocaleDateString()}</Text>
        </View>
        
        {/* Dispatch Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Dispatch Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Lots:</Text>
            <Text>{invoiceData.lots.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Gross Weight:</Text>
            <Text>{invoiceData.totalGrossWeight.toFixed(2)} kg</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Net Weight:</Text>
            <Text>{invoiceData.totalNetWeight.toFixed(2)} kg</Text>
          </View>
        </View>
        
        {/* Lot Details Table */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Lot Details</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableColHeader]}>Lot No</Text>
              <Text style={[styles.tableColHeader]}>Sales Order ID</Text>
              <Text style={[styles.tableColHeader]}>Item Name</Text>
              <Text style={[styles.tableColHeader, styles.rightAlign]}>Quantity (Rolls)</Text>
              <Text style={[styles.tableColHeader, styles.rightAlign]}>Net Weight (kg)</Text>
              <Text style={[styles.tableColHeader, styles.rightAlign]}>Rate</Text>
              <Text style={[styles.tableColHeader, styles.rightAlign]}>Amount</Text>
            </View>
            
            {/* Table Rows */}
            {groupedLots.map((lot, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol]}>{lot.lotNo}</Text>
                <Text style={[styles.tableCol]}>{lot.salesOrderId}</Text>
                <Text style={[styles.tableCol]}>{lot.salesOrderItem?.stockItemName || 'N/A'}</Text>
                <Text style={[styles.tableCol, styles.rightAlign]}>{lot.totalQuantity.toFixed(2)}</Text>
                <Text style={[styles.tableCol, styles.rightAlign]}>{lot.totalNetWeight.toFixed(2)}</Text>
                <Text style={[styles.tableCol, styles.rightAlign]}>{lot.rate.toFixed(2)}</Text>
                <Text style={[styles.tableCol, styles.rightAlign, styles.lastTableCol]}>{lot.totalAmount.toFixed(2)}</Text>
              </View>
            ))}
            
            {/* Grand Total Row */}
            <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', fontWeight: 'bold' }]}>
              <Text style={[styles.tableCol, { borderRightWidth: 0 }]}></Text>
              <Text style={[styles.tableCol, { borderRightWidth: 0 }]}></Text>
              <Text style={[styles.tableCol, { borderRightWidth: 0 }]}></Text>
              <Text style={[styles.tableCol, { borderRightWidth: 0 }]}></Text>
              <Text style={[styles.tableCol, { borderRightWidth: 0 }]}></Text>
              <Text style={[styles.tableCol, styles.rightAlign]}>Grand Total:</Text>
              <Text style={[styles.tableCol, styles.rightAlign, styles.lastTableCol]}>{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by Avyaan Knitfab System - {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;