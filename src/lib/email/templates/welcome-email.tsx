import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface WelcomeEmailProps {
  recipientName: string;
  dashboardUrl: string;
  verifyUrl: string;
}

export function WelcomeEmail({ recipientName, dashboardUrl, verifyUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Loadlinkers — verify your email to keep your 7-day trial</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Welcome to Loadlinkers, {recipientName}!</Heading>
          <Text style={styles.text}>
            Your 7-day free trial is now active. You have full access to every feature — loads,
            carriers, tracking, invoicing, and more — with no credit card required.
          </Text>
          <Text style={styles.text}>
            Log in to your dashboard to get started:
          </Text>
          <Section style={styles.buttonSection}>
            <Button href={dashboardUrl} style={styles.button}>
              Go to your dashboard
            </Button>
          </Section>
          <Text style={styles.text}>
            Your trial gives you 7 days of unrestricted access. At any point during or after your
            trial you can add a payment method to keep your account active.
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.verifyHeading}>Verify your email address</Text>
          <Text style={styles.text}>
            Please confirm this is your email address so we can keep your account secure. Click
            the button below to verify — if you don&apos;t verify within 7 days, you&apos;ll need
            to confirm your email before you can keep making changes in your account.
          </Text>
          <Section style={styles.buttonSection}>
            <Button href={verifyUrl} style={styles.verifyButton}>
              Verify email address
            </Button>
          </Section>

          <Text style={styles.footer}>
            Questions? Just reply to this email or reach us at support@loadlinkers.co.
          </Text>
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
    padding: "40px 36px",
    borderRadius: "12px",
    maxWidth: "520px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "16px",
  },
  text: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "#475569",
    margin: "0 0 16px",
  },
  buttonSection: {
    margin: "24px 0",
  },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
    display: "inline-block",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "28px 0 20px",
  },
  verifyHeading: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 8px",
  },
  verifyButton: {
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 24px",
    textDecoration: "none",
    display: "inline-block",
  },
  footer: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "32px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
  },
} as const;

export default WelcomeEmail;
