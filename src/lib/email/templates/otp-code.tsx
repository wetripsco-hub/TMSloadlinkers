import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export interface OtpCodeEmailProps {
  code: string;
}

export function OtpCodeEmail({ code }: OtpCodeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your verification code is {code}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Verify your sign-in</Heading>
          <Text style={styles.text}>Enter this code to continue:</Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.expiry}>This code expires in 10 minutes.</Text>
          <Text style={styles.footer}>
            If you didn&apos;t request this code, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "32px",
    borderRadius: "12px",
    maxWidth: "420px",
  },
  heading: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "8px",
  },
  text: {
    fontSize: "14px",
    color: "#475569",
  },
  code: {
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "8px",
    color: "#0f172a",
    margin: "16px 0",
  },
  expiry: {
    fontSize: "13px",
    color: "#64748b",
  },
  footer: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "24px",
  },
} as const;

export default OtpCodeEmail;
