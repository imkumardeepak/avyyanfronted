import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type {
  ProductionAllotmentResponseDto,
  MachineAllocationResponseDto,
} from '@/types/api-types';

// Register font (optional)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 600,
    },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2563eb',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  subheader: {
    fontSize: 18,
    fontWeight: 500,
    marginBottom: 10,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    fontWeight: 500,
    fontSize: 12,
  },
  value: {
    width: '70%',
    fontSize: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  table: {
    width: 'auto',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  tableCol: {
    width: '33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 500,
  },
  tableCell: {
    fontSize: 9,
  },
});

// ProductionAllotmentPDFDocument Component
const ProductionAllotmentPDFDocument: React.FC<{
  allotment: ProductionAllotmentResponseDto;
  machine: MachineAllocationResponseDto;
}> = ({ allotment, machine }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Production Allotment Report</Text>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.subheader}>Allotment Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Allotment ID:</Text>
            <Text style={styles.value}>{allotment.allotmentId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Voucher Number:</Text>
            <Text style={styles.value}>{allotment.voucherNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Item Name:</Text>
            <Text style={styles.value}>{allotment.itemName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Actual Quantity:</Text>
            <Text style={styles.value}>{allotment.actualQuantity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Created Date:</Text>
            <Text style={styles.value}>
              {allotment.createdDate ? new Date(allotment.createdDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.subheader}>Fabric Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fabric Type:</Text>
            <Text style={styles.value}>{allotment.fabricType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Yarn Count:</Text>
            <Text style={styles.value}>{allotment.yarnCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Diameter:</Text>
            <Text style={styles.value}>{allotment.diameter}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gauge:</Text>
            <Text style={styles.value}>{allotment.gauge}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Slit Line:</Text>
            <Text style={styles.value}>{allotment.slitLine}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Stitch Length:</Text>
            <Text style={styles.value}>{allotment.stitchLength}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Efficiency:</Text>
            <Text style={styles.value}>{allotment.efficiency}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Composition:</Text>
            <Text style={styles.value}>{allotment.composition}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.subheader}>Machine Allocation Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Machine Name:</Text>
            <Text style={styles.value}>{machine.machineName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Needles:</Text>
            <Text style={styles.value}>{machine.numberOfNeedles}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Feeders:</Text>
            <Text style={styles.value}>{machine.feeders}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>RPM:</Text>
            <Text style={styles.value}>{machine.rpm}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rolls per Kg:</Text>
            <Text style={styles.value}>{machine.rollPerKg.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Load Weight:</Text>
            <Text style={styles.value}>{machine.totalLoadWeight.toFixed(2)} kg</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Rolls:</Text>
            <Text style={styles.value}>{machine.totalRolls}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated Production Time:</Text>
            <Text style={styles.value}>{machine.estimatedProductionTime.toFixed(2)} hours</Text>
          </View>
        </View>

        {machine.rollBreakdown && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.subheader}>Roll Breakdown</Text>

              {machine.rollBreakdown.wholeRolls && machine.rollBreakdown.wholeRolls.length > 0 && (
                <View>
                  <Text style={{ fontWeight: 500, marginBottom: 5 }}>Whole Rolls:</Text>
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Quantity</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Weight per Roll (kg)</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Total Weight (kg)</Text>
                      </View>
                    </View>
                    {machine.rollBreakdown.wholeRolls.map((roll, index) => (
                      <View key={index} style={styles.tableRow}>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>{roll.quantity}</Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>{roll.weightPerRoll.toFixed(2)}</Text>
                        </View>
                        <View style={styles.tableCol}>
                          <Text style={styles.tableCell}>{roll.totalWeight.toFixed(2)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {machine.rollBreakdown.fractionalRoll && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: 500, marginBottom: 5 }}>Fractional Roll:</Text>
                  <View style={styles.table}>
                    <View style={styles.tableRow}>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Quantity</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Weight per Roll (kg)</Text>
                      </View>
                      <View style={styles.tableColHeader}>
                        <Text style={styles.tableCellHeader}>Total Weight (kg)</Text>
                      </View>
                    </View>
                    <View style={styles.tableRow}>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          {machine.rollBreakdown.fractionalRoll.quantity}
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          {machine.rollBreakdown.fractionalRoll.weightPerRoll.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.tableCol}>
                        <Text style={styles.tableCell}>
                          {machine.rollBreakdown.fractionalRoll.totalWeight.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        <Text style={styles.footer}>
          Generated by Avyaan Knitfab System - {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};

export default ProductionAllotmentPDFDocument;
