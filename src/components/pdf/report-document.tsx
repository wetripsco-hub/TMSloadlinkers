import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

export interface ReportBranding {
  orgName: string;
  logoUrl?: string | null;
}

export interface ReportKpiItem {
  label: string;
  value: string;
}

export interface ReportKpiSection {
  heading?: string;
  items: ReportKpiItem[];
}

export interface ReportTableSection {
  heading?: string;
  headers: string[];
  rows: string[][];
}

export interface ReportDocumentProps {
  title: string;
  branding: ReportBranding;
  dateRangeLabel: string;
  kpiSection?: ReportKpiSection;
  tableSection?: ReportTableSection;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#1d4ed8",
    paddingBottom: 12,
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
  orgName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#334155",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
  },
  noData: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#94a3b8",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kpiCell: {
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  kpiLabel: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeaderRow: {
    backgroundColor: "#f1f5f9",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 8,
    fontWeight: 700,
    color: "#475569",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },
});

// Generic, report-agnostic PDF shell: consumers (financial summary, carrier
// performance, load volume, top customers, and future invoice/rate-con
// documents) pass already-formatted strings via kpiSection/tableSection --
// this component has no awareness of what a "revenue" or "on-time pct" is,
// so null-vs-zero display decisions belong to the caller (see
// app/api/pdf/reports/route.ts, which reuses formatOnTimePct from
// lib/domain/reports.ts for that exact reason).
export function ReportDocument({
  title,
  branding,
  dateRangeLabel,
  kpiSection,
  tableSection,
}: ReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {branding.logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image (PDF primitive), not an HTML img; it has no alt prop
            <Image src={branding.logoUrl} style={styles.logo} />
          ) : null}
          <View>
            <Text style={styles.orgName}>{branding.orgName}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{dateRangeLabel}</Text>
          </View>
        </View>

        {kpiSection && (
          <View style={styles.section}>
            {kpiSection.heading ? (
              <Text style={styles.sectionHeading}>{kpiSection.heading}</Text>
            ) : null}
            {kpiSection.items.length === 0 ? (
              <Text style={styles.noData}>No data for this period</Text>
            ) : (
              <View style={styles.kpiGrid}>
                {kpiSection.items.map((item) => (
                  <View key={item.label} style={styles.kpiCell}>
                    <Text style={styles.kpiValue}>{item.value}</Text>
                    <Text style={styles.kpiLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {tableSection && (
          <View style={styles.section}>
            {tableSection.heading ? (
              <Text style={styles.sectionHeading}>{tableSection.heading}</Text>
            ) : null}
            {tableSection.rows.length === 0 ? (
              <Text style={styles.noData}>No data for this period</Text>
            ) : (
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {tableSection.headers.map((header) => (
                    <Text key={header} style={styles.tableHeaderCell}>
                      {header}
                    </Text>
                  ))}
                </View>
                {tableSection.rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.tableRow}>
                    {row.map((cell, cellIndex) => (
                      <Text key={cellIndex} style={styles.tableCell}>
                        {cell}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
