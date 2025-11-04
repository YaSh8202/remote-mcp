import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface OTPEmailProps {
	otp: string;
	type: "email-verification" | "sign-in" | "forget-password";
}

export const OTPEmail = ({ otp, type }: OTPEmailProps) => {
	const getTitle = () => {
		switch (type) {
			case "email-verification":
				return "Verify Your Email";
			case "sign-in":
				return "Sign In Code";
			case "forget-password":
				return "Reset Your Password";
			default:
				return "Verification Code";
		}
	};

	const getDescription = () => {
		switch (type) {
			case "email-verification":
				return "Thank you for signing up! Please use the verification code below to verify your email address.";
			case "sign-in":
				return "Use the code below to sign in to your account.";
			case "forget-password":
				return "You requested to reset your password. Use the code below to proceed.";
			default:
				return "Use the verification code below.";
		}
	};

	return (
		<Html>
			<Head />
			<Preview>{getTitle()}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={logoContainer}>
						<Img
							src="https://remotemcp.tech/logo192.png"
							width="50"
							height="50"
							alt="Remote MCP"
							style={logo}
						/>
					</Section>

					<Heading style={h1}>{getTitle()}</Heading>

					<Text style={text}>{getDescription()}</Text>

					<Section style={otpContainer}>
						<Text style={otpText}>{otp}</Text>
					</Section>

					<Text style={text}>
						This code will expire in 5 minutes. If you didn't request this code,
						please ignore this email.
					</Text>

					<Text style={footer}>
						© 2024 Remote MCP. All rights reserved.
						<br />
						If you have any questions, contact us at support@remotemcp.tech
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

OTPEmail.PreviewProps = {
	otp: "123456",
	type: "email-verification",
} as OTPEmailProps;

export default OTPEmail;

const main = {
	backgroundColor: "#ffffff",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "560px",
};

const logoContainer = {
	marginTop: "32px",
};

const logo = {
	margin: "0 auto",
	display: "block",
};

const h1 = {
	color: "#1d1c1d",
	fontSize: "36px",
	fontWeight: "700",
	margin: "30px 0",
	padding: "0",
	lineHeight: "42px",
	textAlign: "center" as const,
};

const text = {
	color: "#484848",
	fontSize: "14px",
	lineHeight: "24px",
	margin: "16px 0",
	textAlign: "center" as const,
};

const otpContainer = {
	background: "#f4f4f4",
	borderRadius: "8px",
	margin: "32px auto",
	padding: "20px 0",
	width: "fit-content",
};

const otpText = {
	color: "#1d1c1d",
	fontSize: "48px",
	fontWeight: "700",
	letterSpacing: "8px",
	lineHeight: "56px",
	margin: "0",
	padding: "0 40px",
	textAlign: "center" as const,
	fontFamily: "monospace",
};

const footer = {
	color: "#898989",
	fontSize: "12px",
	lineHeight: "22px",
	marginTop: "32px",
	textAlign: "center" as const,
};
