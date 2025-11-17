import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DispatchPlanningDto, SalesOrderDto, SalesOrderItemDto } from '@/types/api-types';

// Create styles matching the provided invoice format exactly
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  companyInfo: {
    width: '50%',
  },
  buyerInfo: {
    width: '50%',
  },
  section: {
    marginVertical: 5,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
  },
  table: {
    width: '100%',
    marginTop: 5,
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
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableCol: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    borderRightStyle: 'solid',
    fontSize: 8,
  },
  lastTableCol: {
    padding: 3,
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
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    paddingTop: 5,
    fontSize: 8,
  },
  // Invoice-specific styles
  invoiceHeader: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addressBlock: {
    fontSize: 8,
    marginBottom: 5,
  },
  gstin: {
    fontWeight: 'bold',
  },
  keyValueRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  key: {
    fontWeight: 'bold',
    width: 80,
  },
  value: {
    flex: 1,
  },
  smallText: {
    fontSize: 7,
  },
  boldText: {
    fontWeight: 'bold',
  },
  // Column widths matching the PDF
  colSerial: { width: '6%' },
  colDescription: { width: '30%' },
  colHSN: { width: '10%' },
  colQuantity: { width: '8%' },
  colRate: { width: '8%' },
  colPer: { width: '6%' },
  colDisc: { width: '6%' },
  colAmount: { width: '12%' },
  colPkgs: { width: '8%' },
  // Tax table styles
  taxTable: {
    width: '60%',
    marginLeft: 'auto',
    marginTop: 10,
  },
  taxRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  taxCol: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    fontSize: 8,
  },
  taxColLast: {
    padding: 3,
    borderRightWidth: 0,
  }
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

// Interface for invoice items matching PDF structure
interface InvoiceItem {
  slNo: number;
  pkgs: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  per: string;
  discount: string;
  amount: number;
  lotDetails: {
    lotNo: string;
    description: string;
  }[];
}

const InvoicePDF: React.FC<{ invoiceData: InvoiceData }> = ({ invoiceData }) => {
  // Create invoice items in the exact format as the PDF
  const invoiceItems: InvoiceItem[] = [];
  
  // Process lots to create invoice items
  invoiceData.lots.forEach((lot, index) => {
    const salesOrder = invoiceData.salesOrders[lot.salesOrderId];
    const salesOrderItem = salesOrder?.items?.find(item => item.salesOrderId === lot.salesOrderId);

    
    if (salesOrderItem) {
      const rate = parseRate(salesOrderItem.rate);
      console.log(rate);
      const amount = calculateTotalAmount(rate, lot.totalNetWeight || 0);
      
      // Extract fabric type and details from stock item name and descriptions
      const fabricType = salesOrderItem.stockItemName || 'N/A';
      const descriptions = salesOrderItem.descriptions || '';
      
      // Create main description similar to PDF format
      const mainDescription = `${fabricType}\nFabric - ${descriptions}`;
      
      invoiceItems.push({
        slNo: index + 1,
        pkgs: `${lot.totalDispatchedRolls} Roll`,
        description: mainDescription,
        hsnSac: '60063200',
        quantity: lot.totalNetWeight || 0,
        rate: rate,
        per: 'Kgs',
        discount: '',
        amount: amount,
        lotDetails: [{
          lotNo: lot.lotNo,
          description: `HO/${lot.lotNo} GSM :- Lot No:-${lot.lotNo}`
        }]
      });
    }
  });
  
  // Calculate totals
  const totalQuantity = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  
  // Tax calculation (as per PDF: 2.5% CGST + 2.5% SGST)
  const taxableValue = totalAmount;
  const cgstRate = 2.5;
  const sgstRate = 2.5;
  const cgstAmount = (taxableValue * cgstRate) / 100;
  const sgstAmount = (taxableValue * sgstRate) / 100;
  const totalTax = cgstAmount + sgstAmount;
  const grandTotal = taxableValue + totalTax;

  // Get company and buyer info
  const firstSalesOrder = Object.values(invoiceData.salesOrders)[0];
  const companyName = 'Avyaan Knitfab'; // Fixed as per PDF
  const buyerName = invoiceData.customerName;

  // Format date
  const invoiceDate = new Date(invoiceData.dispatchDate);
  const formattedDate = invoiceDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.invoiceHeader}>Tax Invoice</Text>
        
        {/* IRN and Ack Details */}
        <View style={styles.row}>
          <Text>IRN : [AUTO_GENERATED_IRN]</Text>
          <Text style={{ marginLeft: 20 }}>Ack No. : [ACK_NUMBER]</Text>
          <Text style={{ marginLeft: 20 }}>Ack Date : {formattedDate}</Text>
        </View>

        <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', marginVertical: 5 }}></View>

        {/* Company and Buyer Information */}
        <View style={styles.headerSection}>
          <View style={styles.companyInfo}>
            <Text style={styles.addressBlock}>
              <Text style={styles.boldText}>Avyaan Knitfab</Text>{"\n"}
              Factory: Survey No.547-551/1, Wajgaon-Deoli Highway,{"\n"}
              At:-Wajgaon(NI) Dist:-Wardha-442001{"\n"}
              <Text style={styles.gstin}>GSTIN/UIN: 27ABYFA2736N1ZO</Text>{"\n"}
              State Name : Maharashtra, Code : 27{"\n"}
              E-Mail : info@avyaanknitfab.com
            </Text>
          </View>
          
          <View style={styles.buyerInfo}>
            <Text style={styles.addressBlock}>
              <Text style={styles.boldText}>Buyer (Bill to)</Text>{"\n"}
              <Text style={styles.boldText}>{buyerName}</Text>{"\n"}
              E-49, E-49/1/2, MIDC Industrial Area,{"\n"}
              Tarapur, Boisar-401506{"\n"}
              Dist- Thane{"\n"}
              <Text style={styles.gstin}>GSTIN/UIN : 27AABCP7263L1ZO</Text>{"\n"}
              State Name : Maharashtra, Code : 27
            </Text>
          </View>
        </View>

        {/* Invoice Details Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.colSerial]}>SR No</Text>
            <Text style={[styles.tableColHeader, styles.colPkgs]}>Packages</Text>
            <Text style={[styles.tableColHeader, styles.colDescription]}>Description of Goods</Text>
            <Text style={[styles.tableColHeader, styles.colHSN]}>HSN/SAC</Text>
            <Text style={[styles.tableColHeader, styles.colQuantity]}>Quantity</Text>
            <Text style={[styles.tableColHeader, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableColHeader, styles.colPer]}>per</Text>
            <Text style={[styles.tableColHeader, styles.colDisc]}>Disc. %</Text>
            <Text style={[styles.tableColHeader, styles.colAmount]}>Amount</Text>
          </View>
          
          {/* Invoice Items */}
          {invoiceItems.map((item, index) => (
            <View key={index}>
              {/* Main Item Row */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colSerial]}>{item.slNo}</Text>
                <Text style={[styles.tableCol, styles.colPkgs]}>{item.pkgs}</Text>
                <Text style={[styles.tableCol, styles.colDescription]}>
                  <Text style={styles.boldText}>{item.description.split('\n')[0]}</Text>
                  {"\n"}
                  {item.description.split('\n').slice(1).join('\n')}
                </Text>
                <Text style={[styles.tableCol, styles.colHSN, styles.centerAlign]}>{item.hsnSac}</Text>
                <Text style={[styles.tableCol, styles.colQuantity, styles.rightAlign]}>{item.quantity.toFixed(4)}</Text>
                <Text style={[styles.tableCol, styles.colRate, styles.rightAlign]}>{item.rate.toFixed(2)}</Text>
                <Text style={[styles.tableCol, styles.colPer, styles.centerAlign]}>{item.per}</Text>
                <Text style={[styles.tableCol, styles.colDisc, styles.centerAlign]}>{item.discount}</Text>
                <Text style={[styles.tableCol, styles.colAmount, styles.rightAlign]}>{item.amount.toFixed(2)}</Text>
              </View>
              
              {/* Lot Details Row */}
              {item.lotDetails.map((lot, lotIndex) => (
                <View key={lotIndex} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.colSerial]}></Text>
                  <Text style={[styles.tableCol, styles.colDescription, styles.smallText]}>
                    {lot.description}
                  </Text>
                  <Text style={[styles.tableCol, styles.colHSN]}></Text>
                  <Text style={[styles.tableCol, styles.colQuantity]}></Text>
                  <Text style={[styles.tableCol, styles.colRate]}></Text>
                  <Text style={[styles.tableCol, styles.colPer]}></Text>
                  <Text style={[styles.tableCol, styles.colDisc]}></Text>
                  <Text style={[styles.tableCol, styles.colAmount]}></Text>
                </View>
              ))}
            </View>
          ))}
          
          {/* Total Row */}
          <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
            <Text style={[styles.tableCol, styles.colSerial]}></Text>
            <Text style={[styles.tableCol, styles.colDescription]}></Text>
            <Text style={[styles.tableCol, styles.colHSN]}></Text>
            <Text style={[styles.tableCol, styles.colQuantity, styles.rightAlign, styles.boldText]}>
              {totalQuantity.toFixed(4)} Kgs
            </Text>
            <Text style={[styles.tableCol, styles.colRate]}></Text>
            <Text style={[styles.tableCol, styles.colPer]}></Text>
            <Text style={[styles.tableCol, styles.colDisc]}></Text>
            <Text style={[styles.tableCol, styles.colAmount, styles.rightAlign, styles.boldText]}>
              ₹ {totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Total Amount in Words */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.boldText}>Amount Chargeable (in words)</Text>
          <Text>INR [AMOUNT_IN_WORDS] Only</Text>
          <Text style={{ textAlign: 'right', fontSize: 8 }}>E. & O.E</Text>
        </View>

        {/* Tax Table */}
        <View style={styles.taxTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, { width: '25%' }]}>HSN/SAC</Text>
            <Text style={[styles.tableColHeader, { width: '25%' }]}>Taxable Value</Text>
            <Text style={[styles.tableColHeader, { width: '25%' }]}>CGST</Text>
            <Text style={[styles.tableColHeader, { width: '25%' }]}>SGST/UTGST</Text>
            <Text style={[styles.tableColHeader, { width: '25%' }]}>Total</Text>
          </View>
          
          <View style={styles.taxRow}>
            <Text style={[styles.taxCol, { width: '25%' }]}>60063200</Text>
            <Text style={[styles.taxCol, { width: '25%' }]}>{taxableValue.toFixed(2)}</Text>
            <Text style={[styles.taxCol, { width: '25%' }]}>
              Rate: {cgstRate}%{"\n"}
              Amount: {cgstAmount.toFixed(2)}
            </Text>
            <Text style={[styles.taxCol, { width: '25%' }]}>
              Rate: {sgstRate}%{"\n"}
              Amount: {sgstAmount.toFixed(2)}
            </Text>
            <Text style={[styles.taxColLast, { width: '25%' }]}>{totalTax.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.taxRow, { backgroundColor: '#f0f0f0' }]}>
            <Text style={[styles.taxCol, { width: '25%' }]}>Total</Text>
            <Text style={[styles.taxCol, { width: '25%' }]}>{taxableValue.toFixed(2)}</Text>
            <Text style={[styles.taxCol, { width: '25%' }]}>{cgstAmount.toFixed(2)}</Text>
            <Text style={[styles.taxCol, { width: '25%' }]}>{sgstAmount.toFixed(2)}</Text>
            <Text style={[styles.taxColLast, { width: '25%' }]}>{totalTax.toFixed(2)}</Text>
          </View>
        </View>

        {/* Tax Amount in Words */}
        <View style={{ marginTop: 5 }}>
          <Text style={styles.boldText}>Tax Amount (in words) : INR [TAX_AMOUNT_IN_WORDS] Only</Text>
        </View>

        {/* Bank Details */}
        <View style={{ marginTop: 10, fontSize: 8 }}>
          <Text style={styles.boldText}>Company's Bank Details</Text>
          <Text>Acc Holder's Name : Avyaan Knitfab</Text>
          <Text>Bank Name : Punjab National Bank A/C No. 0467008700012227</Text>
          <Text>Branch & IFS Code : Wardha-442001 & PUNB0046700</Text>
        </View>

        {/* Remarks and Declaration */}
        <View style={{ marginTop: 10, fontSize: 8 }}>
          <Text>
            <Text style={styles.boldText}>Remarks:</Text> Being sale of knitted fabric
          </Text>
          <Text style={styles.boldText}>Declaration for Avyaan Knitfab</Text>
          <Text>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</Text>
          <Text style={{ textAlign: 'right', marginTop: 20 }}>Authorised Signatory</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a Computer Generated Invoice</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;