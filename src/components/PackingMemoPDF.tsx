import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    width: 100,
  },
  value: {
    fontSize: 9,
    flex: 1,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCol: {
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    padding: 5,
    textAlign: 'center',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureSection: {
    textAlign: 'center',
  },
  signatureLine: {
    marginTop: 30,
    width: 150,
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
  },
});

interface PackingMemoProps {
  dispatchOrderId: string;
  customerName: string;
  customerAddress: string;
  dispatchDate: string;
  lotNumber: string;
  vehicleNumber: string;
  packingDetails: {
    srNo: number;
    psNo: number;
    netWeight: number;
    grossWeight: number;
  }[];
  totalNetWeight: number;
  totalGrossWeight: number;
  remarks?: string;
}

const PackingMemoPDF = ({ 
  dispatchOrderId, 
  customerName, 
  customerAddress, 
  dispatchDate, 
  lotNumber, 
  vehicleNumber, 
  packingDetails, 
  totalNetWeight, 
  totalGrossWeight,
  remarks
}: PackingMemoProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          {/* Placeholder for company logo - in a real implementation, you would use a proper logo */}
          <Image
            src="https://via.placeholder.com/60x60"
            style={styles.logo}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>AVYAAN KNITFAB</Text>
          <Text style={styles.companyAddress}>
            Sr.No.547-551/1, At.Waigaoon-Deoli State Highway, Waigaon (M), Wardha-442001, Maharashtra
          </Text>
          <Text style={styles.companyAddress}>
            GSTIN: 27ABYFA2736N1ZD
          </Text>
        </View>
        <View style={{ width: 100 }}></View>
      </View>

      <Text style={styles.title}>PACKING MEMO</Text>
      
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Dispatch Order ID:</Text>
          <Text style={styles.value}>{dispatchOrderId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Lot No.:</Text>
          <Text style={styles.value}>{lotNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Packing:</Text>
          <Text style={styles.value}>White Polybag + Cello Tape</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{dispatchDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Vehicle No.:</Text>
          <Text style={styles.value}>{vehicleNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Net Wt.:</Text>
          <Text style={styles.value}>{totalNetWeight.toFixed(2)} kg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gross Wt.:</Text>
          <Text style={styles.value}>{totalGrossWeight.toFixed(2)} kg</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCol, { width: '20%' }]}>Sr No.</Text>
          <Text style={[styles.tableCol, { width: '20%' }]}>P.S. No.</Text>
          <Text style={[styles.tableCol, { width: '30%' }]}>Net Wt. (kg)</Text>
          <Text style={[styles.tableCol, { width: '30%' }]}>Gross Wt. (kg)</Text>
        </View>
        
        {packingDetails.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCol, { width: '20%' }]}>{item.srNo}</Text>
            <Text style={[styles.tableCol, { width: '20%' }]}>{item.psNo}</Text>
            <Text style={[styles.tableCol, { width: '30%' }]}>{item.netWeight.toFixed(2)}</Text>
            <Text style={[styles.tableCol, { width: '30%' }]}>{item.grossWeight.toFixed(2)}</Text>
          </View>
        ))}
        
        <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', fontWeight: 'bold' }]}>
          <Text style={[styles.tableCol, { width: '20%' }]}></Text>
          <Text style={[styles.tableCol, { width: '20%' }]}>TOTAL</Text>
          <Text style={[styles.tableCol, { width: '30%' }]}>{totalNetWeight.toFixed(2)}</Text>
          <Text style={[styles.tableCol, { width: '30%' }]}>{totalGrossWeight.toFixed(2)}</Text>
        </View>
      </View>

      {remarks && (
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={styles.label}>Remarks:</Text>
          <Text style={styles.value}>{remarks}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.signatureSection}>
          <Text style={styles.label}>Checked By</Text>
          <View style={styles.signatureLine}></View>
        </View>
        <View style={styles.signatureSection}>
          <Text style={styles.label}>Packing Manager</Text>
          <View style={styles.signatureLine}></View>
        </View>
        <View style={styles.signatureSection}>
          <Text style={styles.label}>Authorised Signatory</Text>
          <View style={styles.signatureLine}></View>
        </View>
      </View>
    </Page>
  </Document>
);

export default PackingMemoPDF;