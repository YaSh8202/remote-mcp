import { MdiGithub } from "@/app/mcp/apps/icons";
import { LLMProvider } from "@/types/models";
import type { SVGProps } from "react";
export const MCPIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="currentColor"
		fillRule="evenodd"
		style={{
			flex: "none",
			lineHeight: 1,
		}}
		viewBox="0 0 24 24"
		{...props}
	>
		<title>{"ModelContextProtocol"}</title>
		<path d="M15.688 2.343a2.588 2.588 0 0 0-3.61 0l-9.626 9.44a.863.863 0 0 1-1.203 0 .823.823 0 0 1 0-1.18l9.626-9.44a4.313 4.313 0 0 1 6.016 0 4.116 4.116 0 0 1 1.204 3.54 4.3 4.3 0 0 1 3.609 1.18l.05.05a4.115 4.115 0 0 1 0 5.9l-8.706 8.537a.274.274 0 0 0 0 .393l1.788 1.754a.823.823 0 0 1 0 1.18.863.863 0 0 1-1.203 0l-1.788-1.753a1.92 1.92 0 0 1 0-2.754l8.706-8.538a2.47 2.47 0 0 0 0-3.54l-.05-.049a2.588 2.588 0 0 0-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 0 1-1.204 0 .823.823 0 0 1 0-1.18l7.273-7.133a2.47 2.47 0 0 0-.003-3.537z" />
		<path d="M14.485 4.703a.823.823 0 0 0 0-1.18.863.863 0 0 0-1.204 0l-7.119 6.982a4.115 4.115 0 0 0 0 5.9 4.314 4.314 0 0 0 6.016 0l7.12-6.982a.823.823 0 0 0 0-1.18.863.863 0 0 0-1.204 0l-7.119 6.982a2.588 2.588 0 0 1-3.61 0 2.47 2.47 0 0 1 0-3.54l7.12-6.982z" />
	</svg>
);

export const VisualStudioCode = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 100 100"
		width="1em"
		height="1em"
		{...props}
	>
		<title>Visual Studio Code</title>
		<mask
			id="a"
			width={100}
			height={100}
			x={0}
			y={0}
			mask-type="alpha"
			maskUnits="userSpaceOnUse"
		>
			<path
				fill="#fff"
				fillRule="evenodd"
				d="M70.912 99.317a6.223 6.223 0 0 0 4.96-.19l20.589-9.907A6.25 6.25 0 0 0 100 83.587V16.413a6.25 6.25 0 0 0-3.54-5.632L75.874.874a6.226 6.226 0 0 0-7.104 1.21L29.355 38.04 12.187 25.01a4.162 4.162 0 0 0-5.318.236l-5.506 5.009a4.168 4.168 0 0 0-.004 6.162L16.247 50 1.36 63.583a4.168 4.168 0 0 0 .004 6.162l5.506 5.01a4.162 4.162 0 0 0 5.318.236l17.168-13.032L68.77 97.917a6.217 6.217 0 0 0 2.143 1.4ZM75.015 27.3 45.11 50l29.906 22.701V27.3Z"
				clipRule="evenodd"
			/>
		</mask>
		<g mask="url(#a)">
			<path
				fill="#0065A9"
				d="M96.461 10.796 75.857.876a6.23 6.23 0 0 0-7.107 1.207l-67.451 61.5a4.167 4.167 0 0 0 .004 6.162l5.51 5.009a4.167 4.167 0 0 0 5.32.236l81.228-61.62c2.725-2.067 6.639-.124 6.639 3.297v-.24a6.25 6.25 0 0 0-3.539-5.63Z"
			/>
			<g filter="url(#b)">
				<path
					fill="#007ACC"
					d="m96.461 89.204-20.604 9.92a6.229 6.229 0 0 1-7.107-1.207l-67.451-61.5a4.167 4.167 0 0 1 .004-6.162l5.51-5.009a4.167 4.167 0 0 1 5.32-.236l81.228 61.62c2.725 2.067 6.639.124 6.639-3.297v.24a6.25 6.25 0 0 1-3.539 5.63Z"
				/>
			</g>
			<g filter="url(#c)">
				<path
					fill="#1F9CF0"
					d="M75.858 99.126a6.232 6.232 0 0 1-7.108-1.21c2.306 2.307 6.25.674 6.25-2.588V4.672c0-3.262-3.944-4.895-6.25-2.589a6.232 6.232 0 0 1 7.108-1.21l20.6 9.908A6.25 6.25 0 0 1 100 16.413v67.174a6.25 6.25 0 0 1-3.541 5.633l-20.601 9.906Z"
				/>
			</g>
			<path
				fill="url(#d)"
				fillRule="evenodd"
				d="M70.851 99.317a6.224 6.224 0 0 0 4.96-.19L96.4 89.22a6.25 6.25 0 0 0 3.54-5.633V16.413a6.25 6.25 0 0 0-3.54-5.632L75.812.874a6.226 6.226 0 0 0-7.104 1.21L29.294 38.04 12.126 25.01a4.162 4.162 0 0 0-5.317.236l-5.507 5.009a4.168 4.168 0 0 0-.004 6.162L16.186 50 1.298 63.583a4.168 4.168 0 0 0 .004 6.162l5.507 5.009a4.162 4.162 0 0 0 5.317.236L29.294 61.96l39.414 35.958a6.218 6.218 0 0 0 2.143 1.4ZM74.954 27.3 45.048 50l29.906 22.701V27.3Z"
				clipRule="evenodd"
				opacity={0.25}
				style={{
					mixBlendMode: "overlay",
				}}
			/>
		</g>
		<defs>
			<filter
				id="b"
				width={116.727}
				height={92.246}
				x={-8.394}
				y={15.829}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feColorMatrix
					in="SourceAlpha"
					values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
				/>
				<feOffset />
				<feGaussianBlur stdDeviation={4.167} />
				<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
				<feBlend
					in2="BackgroundImageFix"
					mode="overlay"
					result="effect1_dropShadow"
				/>
				<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
			</filter>
			<filter
				id="c"
				width={47.917}
				height={116.151}
				x={60.417}
				y={-8.076}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feColorMatrix
					in="SourceAlpha"
					values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
				/>
				<feOffset />
				<feGaussianBlur stdDeviation={4.167} />
				<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
				<feBlend
					in2="BackgroundImageFix"
					mode="overlay"
					result="effect1_dropShadow"
				/>
				<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
			</filter>
			<linearGradient
				id="d"
				x1={49.939}
				x2={49.939}
				y1={0.258}
				y2={99.742}
				gradientUnits="userSpaceOnUse"
			>
				<stop stopColor="#fff" />
				<stop offset={1} stopColor="#fff" stopOpacity={0} />
			</linearGradient>
		</defs>
	</svg>
);

export const Cursor = (props: SVGProps<SVGSVGElement>) => (
	<svg
		height="1em"
		style={{
			flex: "none",
			lineHeight: 1,
		}}
		viewBox="0 0 24 24"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<title>{"Cursor"}</title>
		<path
			d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z"
			fill="url(#lobe-icons-cursorundefined-fill-0)"
		/>
		<path
			d="M22.35 18V6L11.925 0v12l10.425 6z"
			fill="url(#lobe-icons-cursorundefined-fill-1)"
		/>
		<path
			d="M11.925 0L1.5 6v12l10.425-6V0z"
			fill="url(#lobe-icons-cursorundefined-fill-2)"
		/>
		<path d="M22.35 6L11.925 24V12L22.35 6z" fill="#555" />
		<path d="M22.35 6l-10.425 6L1.5 6h20.85z" fill="#ffff" />
		<defs>
			<linearGradient
				gradientUnits="userSpaceOnUse"
				id="lobe-icons-cursorundefined-fill-0"
				x1={11.925}
				x2={11.925}
				y1={12}
				y2={24}
			>
				<stop offset={0.16} stopColor="#ffff" stopOpacity={0.39} />
				<stop offset={0.658} stopColor="#ffff" stopOpacity={0.8} />
			</linearGradient>
			<linearGradient
				gradientUnits="userSpaceOnUse"
				id="lobe-icons-cursorundefined-fill-1"
				x1={22.35}
				x2={11.925}
				y1={6.037}
				y2={12.15}
			>
				<stop offset={0.182} stopColor="#ffff" stopOpacity={0.31} />
				<stop offset={0.715} stopColor="#ffff" stopOpacity={0} />
			</linearGradient>
			<linearGradient
				gradientUnits="userSpaceOnUse"
				id="lobe-icons-cursorundefined-fill-2"
				x1={11.925}
				x2={1.5}
				y1={0}
				y2={18}
			>
				<stop stopColor="#ffff" stopOpacity={0.6} />
				<stop offset={0.667} stopColor="#ffff" stopOpacity={0.22} />
			</linearGradient>
		</defs>
	</svg>
);

export function IconoirTools(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="1em"
			height="1em"
			viewBox="0 0 24 24"
			{...props}
		>
			<title>Tools</title>
			{/* Icon from Iconoir by Luca Burgio - https://github.com/iconoir-icons/iconoir/blob/main/LICENSE */}
			<g
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			>
				<path d="m10.05 10.607l-7.07 7.07a2 2 0 0 0 0 2.83v0a2 2 0 0 0 2.828 0l7.07-7.072m4.315.365l3.878 3.878a2 2 0 0 1 0 2.828v0a2 2 0 0 1-2.828 0l-6.209-6.208M6.733 5.904L4.61 6.61L2.49 3.075l1.414-1.414L7.44 3.782zm0 0l2.83 2.83" />
				<path d="M10.05 10.607c-.844-2.153-.679-4.978 1.061-6.718s4.95-2.121 6.717-1.06l-3.04 3.04l-.283 3.111l3.111-.282l3.04-3.041c1.062 1.768.68 4.978-1.06 6.717c-1.74 1.74-4.564 1.905-6.717 1.061" />
			</g>
		</svg>
	);
}

export const ClaudeAI = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		preserveAspectRatio="xMidYMid"
		viewBox="0 0 256 257"
		{...props}
	>
		<title>Claude AI</title>
		<path
			fill="#D97757"
			d="m50.228 170.321 50.357-28.257.843-2.463-.843-1.361h-2.462l-8.426-.518-28.775-.778-24.952-1.037-24.175-1.296-6.092-1.297L0 125.796l.583-3.759 5.12-3.434 7.324.648 16.202 1.101 24.304 1.685 17.629 1.037 26.118 2.722h4.148l.583-1.685-1.426-1.037-1.101-1.037-25.147-17.045-27.22-18.017-14.258-10.37-7.713-5.25-3.888-4.925-1.685-10.758 7-7.713 9.397.649 2.398.648 9.527 7.323 20.35 15.75L94.817 91.9l3.889 3.24 1.555-1.102.195-.777-1.75-2.917-14.453-26.118-15.425-26.572-6.87-11.018-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0 82.05 1.426l4.472 3.888 6.61 15.101 10.694 23.786 16.591 32.34 4.861 9.592 2.592 8.879.973 2.722h1.685v-1.556l1.36-18.211 2.528-22.36 2.463-28.776.843-8.1 4.018-9.722 7.971-5.25 6.222 2.981 5.12 7.324-.713 4.73-3.046 19.768-5.962 30.98-3.889 20.739h2.268l2.593-2.593 10.499-13.934 17.628-22.036 7.778-8.749 9.073-9.657 5.833-4.601h11.018l8.1 12.055-3.628 12.443-11.342 14.388-9.398 12.184-13.48 18.147-8.426 14.518.778 1.166 2.01-.194 30.46-6.481 16.462-2.982 19.637-3.37 8.88 4.148.971 4.213-3.5 8.62-20.998 5.184-24.628 4.926-36.682 8.685-.454.324.519.648 16.526 1.555 7.065.389h17.304l32.21 2.398 8.426 5.574 5.055 6.805-.843 5.184-12.962 6.611-17.498-4.148-40.83-9.721-14-3.5h-1.944v1.167l11.666 11.406 21.387 19.314 26.767 24.887 1.36 6.157-3.434 4.86-3.63-.518-23.526-17.693-9.073-7.972-20.545-17.304h-1.36v1.814l4.73 6.935 25.017 37.59 1.296 11.536-1.814 3.76-6.481 2.268-7.13-1.297-14.647-20.544-15.1-23.138-12.185-20.739-1.49.843-7.194 77.448-3.37 3.953-7.778 2.981-6.48-4.925-3.436-7.972 3.435-15.749 4.148-20.544 3.37-16.333 3.046-20.285 1.815-6.74-.13-.454-1.49.194-15.295 20.999-23.267 31.433-18.406 19.702-4.407 1.75-7.648-3.954.713-7.064 4.277-6.286 25.47-32.405 15.36-20.092 9.917-11.6-.065-1.686h-.583L44.07 198.125l-12.055 1.555-5.185-4.86.648-7.972 2.463-2.593 20.35-13.999-.064.065Z"
		/>
	</svg>
);

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="1em"
			height="1em"
			viewBox="0 0 128 128"
			{...props}
		>
			{/* Icon from Devicon by konpa - https://github.com/devicons/devicon/blob/master/LICENSE */}
			<title>Google</title>
			<path
				fill="#fff"
				d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"
			/>
			<path
				fill="#e33629"
				d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21"
			/>
			<path
				fill="#f8bd00"
				d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9"
			/>
			<path
				fill="#587dbd"
				d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68"
			/>
			<path
				fill="#319f43"
				d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4"
			/>
		</svg>
	);
}

export const RemoteMcpLogo = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		xmlSpace="preserve"
		fill="currentColor"
		viewBox="0 0 512 512"
		{...props}
	>
		<title>Remote Model Context Protocol</title>
		<path d="M148.567 355.193c7.492 5.536 10.336 13.51 7.81 21.17-2.585 7.839-10.113 12.67-19.542 12.538-43.375-.605-84.052-31.21-95.9-73.52-11.42-40.79-4.449-78.085 25.968-108.86 19.238-19.466 43.187-29.49 70.89-29.213 4.603.046 5.957-2.455 7.205-5.984 6.102-17.252 14.77-33.048 27.179-46.612C200.493 93.76 235.94 80.156 277.41 83.448c61.287 4.865 101.265 49.545 113.52 101.23 1.2 5.056 4.491 5.482 8.236 6.246 18.6 3.794 35.837 10.785 49.223 24.559 28.211 29.028 37.71 63.737 25.972 102.442-11.75 38.748-39.349 61.327-78.947 69.066-6.82 1.333-13.891 1.867-20.847 1.873-7.829.005-13.35-4.357-16.767-11.37-3.161-6.489-2.223-12.553 1.844-18.298 3.021-4.267 7.27-6.013 12.391-6.334 6.466-.406 13.015-.565 19.352-1.76 31.342-5.913 53.002-32.861 52.099-64.384-.912-31.821-24.24-57.386-56.165-61.364-3.775-.47-7.651-.072-11.476-.191-9.955-.311-15.875-5.447-16.997-15.362-2.426-21.428-8.91-41.115-22.905-58.014-40.866-49.346-121.617-40.584-150.345 16.714-4.701 9.377-7.74 19.754-10.35 29.974-3.663 14.357-10.74 19.584-25.233 16.895-38.043-7.06-72.454 18.185-77.097 56.733-3.598 29.872 6.021 54.039 31.58 70.934 10.29 6.803 22.034 8.873 34.115 9.754 3.245.237 6.42 1.446 9.954 2.402z" />
		<path d="M269.708 299c0 6.997-.105 13.497.073 19.99.047 1.672.987 3.32 1.517 4.978 1.472-.547 3.122-.829 4.388-1.682 13.238-8.92 26.363-18.01 39.645-26.867 3.386-2.258 4.822-4.96 5.043-9.023.675-12.393 7.978-21.793 17.832-23.564 10.255-1.842 19.64 2.291 24.322 10.713 5.607 10.085 4.524 22.904-2.734 30.777-6.442 6.988-14.026 9.623-23.43 6.379-1.966-.678-5.053-.324-6.766.829-18.898 12.722-37.59 25.748-56.437 38.546-2.924 1.986-3.452 4.447-3.499 7.636a7469.017 7469.017 0 0 1-1.168 62.431c-.164 7.161-2.544 9.004-10.637 8.863-6.311-.11-8.677-2.615-8.687-9.44-.03-20.492-.063-40.983.039-61.473.018-3.63-.94-6.228-4.098-8.401-17.941-12.348-35.707-24.952-53.685-37.245-2.08-1.422-5.371-2.527-7.656-1.967-17.875 4.382-31.745-6.732-30.74-25.01.657-11.955 9.08-21.581 20.303-23.206 10.183-1.475 20.405 5.33 24.131 16.113.484 1.402 1.263 2.998.99 4.314-1.405 6.788 2.458 10.58 7.36 13.968 12.168 8.413 24.275 16.915 36.494 25.254 1.52 1.037 3.564 1.303 5.366 1.927.495-1.818 1.409-3.633 1.42-5.454.11-17.325-.005-34.652.122-51.976.027-3.661-1.185-6.155-4.04-8.512-12.366-10.203-11.398-30.666 1.707-39.892 13.775-9.698 32.656-.567 35.026 17.028 1.207 8.961-1.228 16.557-8.038 23.006-2.335 2.21-3.959 6.22-4.11 9.49-.476 10.303-.1 20.644-.053 31.47z" />
	</svg>
);

export const OpenAILogo = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		preserveAspectRatio="xMidYMid"
		viewBox="0 0 256 260"
		{...props}
	>
		<title>OpenAI</title>
		<path
			fill="#fff"
			d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
		/>
	</svg>
);

export const AnthropicLogo = (props: SVGProps<SVGSVGElement>) => (
	<svg
		fill="#ffff"
		fillRule="evenodd"
		style={{
			flex: "none",
			lineHeight: 1,
		}}
		viewBox="0 0 24 24"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
		height="1em"
		{...props}
	>
		<title>{"Anthropic"}</title>
		<path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
	</svg>
);

export const Gemini = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="0 0 296 298"
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		{...props}
	>
		<title>Gemini</title>
		<mask
			id="gemini__a"
			width={296}
			height={298}
			x={0}
			y={0}
			maskUnits="userSpaceOnUse"
			style={{
				maskType: "alpha",
			}}
		>
			<path
				fill="#3186FF"
				d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z"
			/>
		</mask>
		<g mask="url(#gemini__a)">
			<g filter="url(#gemini__b)">
				<ellipse cx={163} cy={149} fill="#3689FF" rx={196} ry={159} />
			</g>
			<g filter="url(#gemini__c)">
				<ellipse cx={33.5} cy={142.5} fill="#F6C013" rx={68.5} ry={72.5} />
			</g>
			<g filter="url(#gemini__d)">
				<ellipse cx={19.5} cy={148.5} fill="#F6C013" rx={68.5} ry={72.5} />
			</g>
			<g filter="url(#gemini__e)">
				<path
					fill="#FA4340"
					d="M194 10.5C172 82.5 65.5 134.333 22.5 135L144-66l50 76.5Z"
				/>
			</g>
			<g filter="url(#gemini__f)">
				<path
					fill="#FA4340"
					d="M190.5-12.5C168.5 59.5 62 111.333 19 112L140.5-89l50 76.5Z"
				/>
			</g>
			<g filter="url(#gemini__g)">
				<path
					fill="#14BB69"
					d="M194.5 279.5C172.5 207.5 66 155.667 23 155l121.5 201 50-76.5Z"
				/>
			</g>
			<g filter="url(#gemini__h)">
				<path
					fill="#14BB69"
					d="M196.5 320.5C174.5 248.5 68 196.667 25 196l121.5 201 50-76.5Z"
				/>
			</g>
		</g>
		<defs>
			<filter
				id="gemini__b"
				width={464}
				height={390}
				x={-69}
				y={-46}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur
					result="effect1_foregroundBlur_69_17998"
					stdDeviation={18}
				/>
			</filter>
			<filter
				id="gemini__c"
				width={265}
				height={273}
				x={-99}
				y={6}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur
					result="effect1_foregroundBlur_69_17998"
					stdDeviation={32}
				/>
			</filter>
			<filter
				id="gemini__d"
				width={265}
				height={273}
				x={-113}
				y={12}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur
					result="effect1_foregroundBlur_69_17998"
					stdDeviation={32}
				/>
			</filter>
			<filter
				id="gemini__e"
				width={299.5}
				height={329}
				x={-41.5}
				y={-130}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur
					result="effect1_foregroundBlur_69_17998"
					stdDeviation={32}
				/>
			</filter>
			<filter
				id="gemini__f"
				width={299.5}
				height={329}
				x={-45}
				y={-153}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur
					result="effect1_foregroundBlur_69_17998"
					stdDeviation={32}
				/>
			</filter>
			<filter
				id="gemini__g"
				width={299.5}
				height={329}
				x={-41}
				y={91}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur
					result="effect1_foregroundBlur_69_17998"
					stdDeviation={32}
				/>
			</filter>
			<filter
				id="gemini__h"
				width={299.5}
				height={329}
				x={-39}
				y={132}
				colorInterpolationFilters="sRGB"
				filterUnits="userSpaceOnUse"
			>
				<feFlood floodOpacity={0} result="BackgroundImageFix" />
				<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur
					result="effect1_foregroundBlur_69_17998"
					stdDeviation={32}
				/>
			</filter>
		</defs>
	</svg>
);

export const MistralAI = (props: SVGProps<SVGSVGElement>) => (
	<svg {...props} preserveAspectRatio="xMidYMid" viewBox="0 0 256 233">
		<title>Mistral AI</title>
		<path d="M186.18182 0h46.54545v46.54545h-46.54545z" />
		<path fill="#F7D046" d="M209.45454 0h46.54545v46.54545h-46.54545z" />
		<path d="M0 0h46.54545v46.54545H0zM0 46.54545h46.54545V93.0909H0zM0 93.09091h46.54545v46.54545H0zM0 139.63636h46.54545v46.54545H0zM0 186.18182h46.54545v46.54545H0z" />
		<path fill="#F7D046" d="M23.27273 0h46.54545v46.54545H23.27273z" />
		<path
			fill="#F2A73B"
			d="M209.45454 46.54545h46.54545V93.0909h-46.54545zM23.27273 46.54545h46.54545V93.0909H23.27273z"
		/>
		<path d="M139.63636 46.54545h46.54545V93.0909h-46.54545z" />
		<path
			fill="#F2A73B"
			d="M162.90909 46.54545h46.54545V93.0909h-46.54545zM69.81818 46.54545h46.54545V93.0909H69.81818z"
		/>
		<path
			fill="#EE792F"
			d="M116.36364 93.09091h46.54545v46.54545h-46.54545zM162.90909 93.09091h46.54545v46.54545h-46.54545zM69.81818 93.09091h46.54545v46.54545H69.81818z"
		/>
		<path d="M93.09091 139.63636h46.54545v46.54545H93.09091z" />
		<path
			fill="#EB5829"
			d="M116.36364 139.63636h46.54545v46.54545h-46.54545z"
		/>
		<path
			fill="#EE792F"
			d="M209.45454 93.09091h46.54545v46.54545h-46.54545zM23.27273 93.09091h46.54545v46.54545H23.27273z"
		/>
		<path d="M186.18182 139.63636h46.54545v46.54545h-46.54545z" />
		<path
			fill="#EB5829"
			d="M209.45454 139.63636h46.54545v46.54545h-46.54545z"
		/>
		<path d="M186.18182 186.18182h46.54545v46.54545h-46.54545z" />
		<path fill="#EB5829" d="M23.27273 139.63636h46.54545v46.54545H23.27273z" />
		<path
			fill="#EA3326"
			d="M209.45454 186.18182h46.54545v46.54545h-46.54545zM23.27273 186.18182h46.54545v46.54545H23.27273z"
		/>
	</svg>
);

export const Groq = (props: SVGProps<SVGSVGElement>) => (
	<svg {...props} viewBox="0 0 201 201">
		<title>Groq</title>
		<path fill="#F54F35" d="M0 0h201v201H0V0Z" />
		<path
			fill="#FEFBFB"
			d="m128 49 1.895 1.52C136.336 56.288 140.602 64.49 142 73c.097 1.823.148 3.648.161 5.474l.03 3.247.012 3.482.017 3.613c.01 2.522.016 5.044.02 7.565.01 3.84.041 7.68.072 11.521.007 2.455.012 4.91.016 7.364l.038 3.457c-.033 11.717-3.373 21.83-11.475 30.547-4.552 4.23-9.148 7.372-14.891 9.73l-2.387 1.055c-9.275 3.355-20.3 2.397-29.379-1.13-5.016-2.38-9.156-5.17-13.234-8.925 3.678-4.526 7.41-8.394 12-12l3.063 2.375c5.572 3.958 11.135 5.211 17.937 4.625 6.96-1.384 12.455-4.502 17-10 4.174-6.784 4.59-12.222 4.531-20.094l.012-3.473c.003-2.414-.005-4.827-.022-7.241-.02-3.68 0-7.36.026-11.04-.003-2.353-.008-4.705-.016-7.058l.025-3.312c-.098-7.996-1.732-13.21-6.681-19.47-6.786-5.458-13.105-8.211-21.914-7.792-7.327 1.188-13.278 4.7-17.777 10.601C75.472 72.012 73.86 78.07 75 85c2.191 7.547 5.019 13.948 12 18 5.848 3.061 10.892 3.523 17.438 3.688l2.794.103c2.256.082 4.512.147 6.768.209v16c-16.682.673-29.615.654-42.852-10.848-8.28-8.296-13.338-19.55-13.71-31.277.394-9.87 3.93-17.894 9.562-25.875l1.688-2.563C84.698 35.563 110.05 34.436 128 49Z"
		/>
	</svg>
);

export const Qwen = (props: SVGProps<SVGSVGElement>) => (
	<svg
		{...props}
		fill="#ffff"
		fillRule="evenodd"
		style={{
			flex: "none",
			lineHeight: 1,
		}}
		viewBox="0 0 24 24"
	>
		<title>Qwen</title>
		<path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" />
	</svg>
);

export const llmProviderIcons = {
	[LLMProvider.ANTHROPIC]: AnthropicLogo,
	[LLMProvider.OPENAI]: OpenAILogo,
	[LLMProvider.GOOGLE]: Gemini,
	[LLMProvider.MISTRAL]: MistralAI,
	[LLMProvider.GROQ]: Groq,
	[LLMProvider.ALIBABA]: Qwen,
	[LLMProvider.GITHUB_MODELS]: MdiGithub,
};

/**
 * Provider logo component using SVG icons for better dark mode support
 */
export function ProviderLogo({
	provider,
	className,
	size = 24,
}: {
	provider: LLMProvider;
	className?: string;
	size?: number;
}) {
	const Icon = llmProviderIcons[provider];

	if (!Icon) {
		// Fallback for unknown providers
		return (
			<div
				className={className}
				style={{
					width: size,
					height: size,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				?
			</div>
		);
	}

	return <Icon className={className} style={{ width: size, height: size }} />;
}
