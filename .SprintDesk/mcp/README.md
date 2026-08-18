# SprintDesk MCP Server

Local MCP server for integrating SprintDesk with AI agents like Copilot, Claude, etc.

## Available Tools

### Task Tools
- sprintdesk_createTask, sprintdesk_getTask, sprintdesk_updateTask, sprintdesk_deleteTask
- sprintdesk_listTasks, sprintdesk_searchTasks

### Epic Tools  
- sprintdesk_createEpic, sprintdesk_getEpic, sprintdesk_updateEpic, sprintdesk_deleteEpic
- sprintdesk_listEpics, sprintdesk_getTasksByEpic, sprintdesk_addTaskToEpic

### Sprint Tools
- sprintdesk_createSprint, sprintdesk_getSprint, sprintdesk_updateSprint, sprintdesk_deleteSprint
- sprintdesk_listSprints, sprintdesk_getTasksBySprint, sprintdesk_addTaskToSprint

### Backlog Tools
- sprintdesk_createBacklog, sprintdesk_getBacklog, sprintdesk_listBacklogs, sprintdesk_addTaskToBacklog

### Move Tools
- sprintdesk_moveTaskToEpic, sprintdesk_moveTaskToSprint, sprintdesk_moveTaskToBacklog

## Usage

AI agents can discover and use these tools through the MCP protocol when this extension is active.
