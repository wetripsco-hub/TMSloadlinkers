import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface TeamInviteEmailProps {
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}

export function TeamInviteEmail({
  organizationName,
  inviterName,
  role,
  inviteUrl,
}: TeamInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${inviterName} invited you to join ${organizationName} on Loadlinkers`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>You&apos;re invited to {organizationName}</Heading>
          <Text style={styles.text}>
            {inviterName} has invited you to join <strong>{organizationName}</strong> on
            Loadlinkers as a <strong>{role.replace(/_/g, " ")}</strong>.
          </Text>
          <Text style={styles.text}>
            Click below to accept the invitation and set up your account:
          </Text>
          <Section style={styles.buttonSection}>
            <Button href={inviteUrl} style={styles.button}>
              Accept invitation
            </Button>
          </Section>
          <Text style={styles.text}>
            This invitation will expire in 7 days. If you weren&apos;t expecting this, you can
            safely ignore this email.
          </Text>
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
  footer: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "32px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
  },
} as const;

export default TeamInviteEmail;
