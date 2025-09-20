<div align="center">

<img src="public/logo192.png" alt="Remote MCP Logo" width="120" height="120" />

# Remote MCP 🚀

**Create and connect MCP servers to your favorite AI clients - no complex setup required!**

</div>

[🌐 Try Remote MCP](https://remotemcp.tech) | [📖 What is MCP?](#what-is-mcp) | [✨ Key Features](#key-features) | [🚀 Getting Started](#getting-started)

---

## What is Remote MCP?

Remote MCP is a cloud-based platform that lets you easily create and manage **Model Context Protocol (MCP) servers** and connect them to your favorite AI clients like Claude Desktop, Cursor, or any MCP-compatible application. It now includes a powerful **AI Agent Chat Interface** where your AI can directly interact with your connected MCP servers.

Think of it as a bridge between your AI assistant and the apps you use every day - GitHub, Slack, YouTube, PostgreSQL, and many more!

![Remote MCP Dashboard](assets/screenshot-servers.png)

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard that enables AI assistants to securely connect to external data sources and tools. Instead of just chatting, your AI can now:

- 📝 Create GitHub issues and pull requests
- 💬 Send Slack messages
- 🗄️ Query databases
- 🔍 Search the web
- 📺 Manage YouTube content
- And much more!

### How MCP Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ AI Client   │────│ MCP Server  │────│   Your App  │
│ (Claude)    │    │ (Remote MCP)│    │ (GitHub)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

1.  **AI Client**: Your favorite AI assistant (Claude Desktop, Cursor, or the new built-in AI Agent Chat Interface).
2.  **MCP Server**: Acts as a bridge (that's what Remote MCP provides!)
3.  **Your App**: The service you want to connect (GitHub, Slack, etc.)

## ✨ Key Features

-   **AI Agent Chat Interface**: Engage with your AI assistant through a dynamic chat interface, complete with conversation history, real-time messaging, and easy new chat creation.
-   **Seamless MCP Server Integration**: Connect your AI chat directly to your MCP servers, allowing your AI to utilize a wide range of tools from your integrated applications.
-   **Robust OAuth 2.1 Authentication**: Securely connect your MCP servers with industry-standard OAuth 2.1, featuring client registration, authorization, token management, and granular scope-based access controls.
-   **Intuitive User Experience**: Benefit from a dedicated landing page for a smooth onboarding experience and a visually appealing dashboard for managing your servers and connections.
-   **Cloud-Based & Always Available**: Your MCP servers are cloud-hosted, ensuring 24/7 availability and accessibility from any MCP client.

## Why Remote MCP?

### 🎯 **Simple Setup**

No need to run local servers or manage complex configurations. Just create, configure, and connect! With our new chat interface, getting started with AI-powered interactions is even easier.

### 🔒 **Secure & Reliable**

Your credentials are encrypted and managed securely. We handle authentication, API limits, and security, now including robust OAuth 2.1 for MCP servers.

### 🌍 **Always Available**

Cloud-hosted servers that work 24/7, accessible from any MCP client, including our new AI Agent Chat Interface.

### 📊 **Visual Management**

Easy-to-use dashboard to manage your servers, connections, and monitor usage.

## Available Apps

Remote MCP supports integration with popular apps and services:

### Developer Tools
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/github.svg" width="16" height="16" style="vertical-align: middle;"> GitHub** - Comprehensive repository management with issues, pull requests, and code operations (32 tools)
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/gitlab.svg" width="16" height="16" style="vertical-align: middle;"> GitLab** - GitLab integration for merge requests, issues, and project management (10 tools)
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/atlassian.svg" width="16" height="16" style="vertical-align: middle;"> Atlassian** - Complete Jira and Confluence integration for project management and documentation (21 tools)

### Communication & Productivity
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/slack.svg" width="16" height="16" style="vertical-align: middle;"> Slack** - Send messages, search conversations, and manage channels (5 tools)
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/notion.svg" width="16" height="16" style="vertical-align: middle;"> Notion** - Database queries, page management, and content creation (18 tools)
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/spotify.svg" width="16" height="16" style="vertical-align: middle;"> Spotify** - Music playback control, playlist management, and discovery (19 tools)
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/googledrive.svg" width="16" height="16" style="vertical-align: middle;"> Google Drive** - File management and Google Sheets operations (10 tools)

### Content & Media
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/youtube.svg" width="16" height="16" style="vertical-align: middle;"> YouTube** - Comprehensive video, channel, playlist, and analytics management (27 tools)

### Data & Search
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/postgresql.svg" width="16" height="16" style="vertical-align: middle;"> PostgreSQL** - Database queries and management (8 tools)
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/brave.svg" width="16" height="16" style="vertical-align: middle;"> Brave Search** - Web search, image search, news, and local business searches (5 tools)

### Utilities
- **<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/fastapi.svg" width="16" height="16" style="vertical-align: middle;"> Fetch** - HTTP requests and web content fetching in multiple formats (4 tools)

> **Total: 159+ tools across 11 integrated applications**

_New apps and tools are being added regularly! Have a specific integration in mind? Let us know!_

## Getting Started

### 1. Create Your MCP Server

1.  Visit [remotemcp.tech](https://remotemcp.tech) (Our new landing page awaits you!)
2.  Sign up with Google or GitHub
3.  Click "Add Server" to create your first MCP server
4.  Choose the apps you want to connect (GitHub, Slack, etc.)

### 2. Configure App Connections

1.  Go to the "Connections" tab
2.  Click "New Connection"
3.  Select your app and authenticate
4.  Your credentials are securely stored and encrypted

### 3. Connect to Your AI Client or Use Our AI Agent Chat

Add your Remote MCP server to your AI client or start a new conversation in our built-in chat:

**Using the AI Agent Chat Interface:**
Simply navigate to the `/chat` route on remotemcp.tech and start a new conversation. Your connected MCP servers will be available as tools for the AI.

**For VS Code & Cursor:**
Simply click the **"Add to VS Code"** or **"Add to Cursor"** button in your server dashboard - it automatically configures everything for you!

**For Claude Desktop:**
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "remote-mcp": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-everything",
        "https://remotemcp.tech/api/mcp/YOUR_SERVER_ID"
      ]
    }
  }
}
```

**For Other Clients:**
Use the MCP endpoint URL: `https://remotemcp.tech/api/mcp/YOUR_SERVER_ID`

### 4. Start Using!

Your AI assistant can now interact with your connected apps. Try asking in the AI Agent Chat or your preferred client:

**Developer Workflows:**
- "Create a GitHub issue for the bug I found"
- "Create a new Jira ticket and assign it to me"
- "Search for merge requests in my GitLab projects"

**Communication & Content:**
- "Send a message to the #general Slack channel"
- "Create a new page in my Notion workspace"
- "Search for recent videos about AI on YouTube"

**Data & Analysis:**
- "Query our PostgreSQL database for user metrics"
- "Search the web for the latest React best practices"
- "Play my favorite playlist on Spotify"

<!-- ## Contributing

We welcome contributions! Check out our [contributing guidelines](CONTRIBUTING.md) to get started. -->

## License

This project is licensed under the MIT License - see the [MIT](LICENSE) file for details.

---

**Made with ❤️ for the AI community**

[Get Started](https://remotemcp.tech)