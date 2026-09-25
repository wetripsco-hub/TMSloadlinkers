import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

export interface AdminSignupAlertProps {
  companyName: string;
  mcNumber: string;
  brokerName: string;
  brokerEmail: string;
  selectedPlan: string;
}

export function AdminSignupAlert({
  companyName,
  mcNumber,
  brokerName,
  brokerEmail,
  selectedPlan,
}: AdminSignupAlertProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Company", value: companyName },
    { label: "MC #", value: mcNumber || "—" },
    { label: "Broker", value: brokerName },
    { label: "Email", value: brokerEmail },
    { label: "Plan", value: selectedPlan },
  ];

  return (
    <Html>
      <Head />
      <Preview>New signup: {companyName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>New signup: {companyName}</Heading>
          <Section style={styles.table}>
            {rows.map(({ label, value }) => (
              <Row key={label} style={styles.row}>
                <Column style={styles.labelCell}>{label}</Column>
                <Column style={styles.valueCell}>{value}</Column>
              </Row>
            ))}
          </Section>
          <Text style={styles.footer}>Loadlinkers platform alert</Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "32px",
    borderRadius: "12px",
    maxWidth: "480px",
  },
  heading: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "20px",
  },
  table: {
    borderTop: "1px solid #e2e8f0",
  },
  row: {
    borderBottom: "1px solid #e2e8f0",
  },
  labelCell: {
    padding: "10px 8px 10px 0",
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    width: "90px",
  },
  valueCell: {
    padding: "10px 0",
    fontSize: "14px",
    color: "#0f172a",
  },
  footer: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "24px",
  },
} as const;

export default AdminSignupAlert;
