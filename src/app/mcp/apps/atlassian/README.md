# Atlassian MCP App

This MCP app provides integration with Atlassian products (Jira and Confluence) through OAuth2 authentication.

## Features

### Jira Tools
- **getJiraIssue**: Get details of a specific Jira issue
- **searchJiraIssues**: Search Jira issues using JQL (Jira Query Language)
- **createJiraIssue**: Create a new Jira issue
- **updateJiraIssue**: Update an existing Jira issue
- **transitionJiraIssue**: Transition a Jira issue to a new status
- **addJiraComment**: Add a comment to a Jira issue
- **getJiraUserProfile**: Get Jira user profile information
- **getAllJiraProjects**: Get all accessible Jira projects
- **getJiraTransitions**: Get available transitions for a Jira issue
- **addJiraWorklog**: Add a worklog entry to a Jira issue

### Confluence Tools
- **searchConfluence**: Search Confluence content using text or CQL queries
- **getConfluencePage**: Get content of a specific Confluence page
- **createConfluencePage**: Create a new Confluence page
- **updateConfluencePage**: Update an existing Confluence page
- **getConfluencePageChildren**: Get child pages of a Confluence page
- **getConfluenceComments**: Get comments for a Confluence page
- **addConfluenceComment**: Add a comment to a Confluence page

### Context Tools
- **getAtlassianUser**: Get details of the authenticated Atlassian user

## Authentication

This app uses OAuth2 authentication with the following scopes:
- `read:jira-work`: Read Jira work data
- `write:jira-work`: Write Jira work data
- `read:confluence-content.all`: Read all Confluence content
- `write:confluence-content`: Write Confluence content
- `offline_access`: Refresh token access

## Setup

1. Create an OAuth2 app in the [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Configure the OAuth2 integration with the required scopes
3. Set the callback URL in your OAuth2 app configuration
4. Configure the MCP app with your OAuth2 credentials

## Required Parameters

Most tools require a `cloudId` parameter which identifies your Atlassian Cloud instance. You can obtain this from your Atlassian instance URL or by calling the Atlassian API.

## API Documentation

This implementation follows the Atlassian REST API v3 for Jira and the Confluence REST API. For detailed API documentation, see:
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Confluence REST API](https://developer.atlassian.com/cloud/confluence/rest/v1/)

## Examples

### Search Jira Issues
```
JQL: "project = MYPROJECT AND status = Open"
```

### Create Confluence Page
```
Space Key: MYSPACE
Title: "Meeting Notes"
Content: "<h1>Meeting Notes</h1><p>Today's discussion...</p>"
```

### Transition Jira Issue
```
Issue Key: PROJ-123
Transition ID: "31" (use getJiraTransitions to find available transitions)
```


Next Tasks for Remote-MCP:
- Add Ratelimiting to the API
- Implement Landing page
- Add more integrations
- Demo video
- Allow to add mcp servers/tools to the chat
- Message/Chat branching, Regenerate and edit messages
- 