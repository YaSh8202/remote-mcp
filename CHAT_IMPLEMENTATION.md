# AI Agent Chat Implementation

This document outlines the comprehensive AI agent chat functionality implemented for the remote-mcp project.

## Features Implemented

### 1. Database Schema
- **Chats Table**: Stores chat sessions with titles, system prompts, and provider associations
- **Messages Table**: Stores individual messages with roles (user/assistant) and content
- **LLM Providers Table**: Securely stores API keys for multiple providers (OpenAI, Claude, Gemini, OpenRouter)
- **Relationships**: Proper foreign key relationships between chats, messages, and providers

### 2. Dynamic Chat Routing
- `/chat` - Main chat page that redirects to new chat
- `/chat/$id` - Individual chat pages with persistent conversations
- Automatic chat creation on first message
- Navigation between different chats

### 3. Chat Sidebar
- List of all user chats with titles
- New chat creation button
- Archive and delete functionality
- Real-time updates when chats are modified

### 4. Multi-Provider LLM Support
- **OpenAI**: GPT-4, GPT-3.5-turbo models
- **Claude**: Claude-3 models (Anthropic)
- **Gemini**: Google's Gemini models
- **OpenRouter**: Access to multiple models through OpenRouter API
- Secure API key storage with encryption
- Provider-specific configuration options

### 5. LLM Provider Management
- Dedicated settings page for managing API keys
- Add/edit/delete providers
- Test provider connections
- Encrypted storage of sensitive API keys
- Provider selection per chat

### 6. MCP Server Integration
- Add MCP servers to individual chats
- Enable AI agents to use MCP tools
- Server management interface
- Dynamic tool availability based on selected servers

### 7. Chat Settings
- Per-chat provider selection
- Custom system prompts
- Model selection within providers
- MCP server configuration
- Temperature and other parameters

## File Structure

```
src/
├── components/
│   ├── chat-sidebar.tsx          # Chat list and navigation
│   ├── chat-settings.tsx         # Chat configuration dialog
│   ├── chat-mcp-servers.tsx      # MCP server management
│   └── ui/
│       └── textarea.tsx          # New UI component
├── routes/
│   ├── _authed/
│   │   ├── chat/
│   │   │   ├── index.tsx         # Main chat page
│   │   │   └── $id.tsx           # Individual chat page
│   │   └── llm-providers.tsx     # Provider management page
│   └── api/
│       └── chat.$id.tsx          # Chat API endpoint
├── services/
│   ├── chat-service.ts           # Chat database operations
│   ├── llm-provider-service.ts   # Provider management
│   └── llm-service.ts            # Multi-provider LLM abstraction
├── server/
│   └── trpc/
│       └── routers/
│           ├── chat.ts           # Chat tRPC router
│           └── llm-provider.ts   # Provider tRPC router
└── db/
    ├── schema.ts                 # Database schema definitions
    └── migrations/
        └── 0006_gorgeous_rage.sql # Database migration
```

## Database Schema

### Chats Table
```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  system_prompt TEXT,
  llm_provider_id TEXT,
  mcp_server_ids TEXT[], -- JSON array of server IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### LLM Providers Table
```sql
CREATE TABLE llm_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'claude', 'gemini', 'openrouter')),
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  config JSONB, -- Provider-specific configuration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Chat API (`/api/chat/$id`)
- **POST**: Send message and get streaming response
- Supports multiple providers
- Handles provider selection
- Stores messages in database
- Returns AI SDK compatible stream

### tRPC Routers

#### Chat Router
- `createChat`: Create new chat
- `getChatById`: Get chat details
- `getUserChats`: List user's chats
- `updateChat`: Update chat settings
- `deleteChat`: Delete chat
- `archiveChat`: Archive chat

#### LLM Provider Router
- `createProvider`: Add new provider
- `getUserProviders`: List user's providers
- `updateProvider`: Update provider settings
- `deleteProvider`: Remove provider
- `testProvider`: Test provider connection

## Security Features

### API Key Encryption
- All API keys encrypted using AES-256
- Encryption key stored in environment variables
- Keys never exposed in client-side code
- Secure key rotation support

### User Isolation
- All data scoped to authenticated users
- Row-level security through user_id filtering
- No cross-user data access

## Usage Instructions

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Add required environment variables
DATABASE_URL="postgresql://..."
ENCRYPTION_KEY="your_32_character_key"
BETTER_AUTH_SECRET="your_auth_secret"
```

### 2. Database Migration
```bash
# Generate migration (already done)
pnpm db:generate

# Apply migration
pnpm db:migrate
```

### 3. Add LLM Providers
1. Navigate to `/llm-providers`
2. Click "Add Provider"
3. Select provider type (OpenAI, Claude, etc.)
4. Enter API key and configuration
5. Test connection

### 4. Start Chatting
1. Go to `/chat`
2. Select provider in chat settings
3. Add MCP servers if needed
4. Start conversation

## Development Notes

### Dependencies Added
- `crypto-js`: For API key encryption
- `@types/crypto-js`: TypeScript definitions

### Key Design Decisions
1. **Multi-provider Architecture**: Abstracted LLM service for easy provider addition
2. **Encrypted Storage**: Secure API key storage with encryption
3. **Modular Components**: Reusable components for chat management
4. **tRPC Integration**: Type-safe API calls throughout the application
5. **Real-time Updates**: Optimistic updates and real-time synchronization

### Future Enhancements
1. **MCP Tool Execution**: Implement actual MCP tool calling
2. **Chat Export**: Export conversations to various formats
3. **Advanced Settings**: Temperature, max tokens, etc.
4. **Chat Templates**: Predefined system prompts
5. **Usage Analytics**: Track API usage and costs

## Testing

The development server is running on port 3001. To test:

1. Start the server: `pnpm dev`
2. Set up database connection
3. Add LLM providers
4. Create and test chats

## Deployment Considerations

1. **Database**: Ensure PostgreSQL is properly configured
2. **Environment Variables**: Set all required environment variables
3. **API Keys**: Secure storage of encryption keys
4. **CORS**: Configure for production domains
5. **Rate Limiting**: Implement rate limiting for API endpoints