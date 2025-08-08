# Team Staff Management

This document describes the team staff management feature that allows team owners to manage users assigned to their teams.

## Overview

The team staff management feature provides a comprehensive set of APIs for team owners to:

- View all team members
- Add new members to their teams
- Update member roles
- Remove members from their teams

## API Endpoints

### Base URL
All endpoints are prefixed with `/api/v1/teams/:id` where `:id` is the team ID.

### Authentication
All endpoints require authentication via Bearer token in the Authorization header.

### Authorization
Only team owners can access these endpoints. Users who are not the team owner will receive a 400 Bad Request error.

## Endpoints

### 1. Get Team Members

**GET** `/api/v1/teams/:id/members`

Retrieves all members of a specific team.

**Response:**
```json
[
  {
    "id": "member_id",
    "teamId": "team_id",
    "userId": "user_id",
    "role": "member",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

### 2. Add Team Member

**POST** `/api/v1/teams/:id/members`

Adds a new member to the team.

**Request Body:**
```json
{
  "userId": "user_id",
  "role": "member"
}
```

**Response:**
```json
{
  "id": "member_id",
  "teamId": "team_id",
  "userId": "user_id",
  "role": "member",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Validation Rules:**
- Team owner cannot add themselves as a member
- User must exist in the system
- User cannot already be a member of the team
- Role is required

### 3. Update Team Member Role

**PUT** `/api/v1/teams/:id/members/:memberId`

Updates the role of a specific team member.

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "id": "member_id",
  "teamId": "team_id",
  "userId": "user_id",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 4. Remove Team Member

**DELETE** `/api/v1/teams/:id/members/:memberId`

Removes a member from the team.

**Response:**
```json
{
  "message": "Team member removed successfully"
}
```

**Validation Rules:**
- Team owner cannot remove themselves from the team
- Member must exist in the team

## Error Responses

### 400 Bad Request
Returned when:
- User is not the team owner
- Team does not exist
- Member does not exist
- Validation errors (missing required fields, duplicate members, etc.)

Example:
```json
{
  "error": "You do not have permission to view this team's members"
}
```

### 401 Unauthorized
Returned when authentication token is missing or invalid.

### 500 Internal Server Error
Returned when an unexpected server error occurs.

## Database Schema

The feature uses the existing `team_users` table with the following structure:

```sql
CREATE TABLE team_users (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Role Management

The system supports flexible role management. Common roles include:
- `member` - Basic team member
- `admin` - Administrative privileges
- `moderator` - Moderate team content
- `viewer` - Read-only access

Roles are stored as strings, allowing for custom role definitions based on your application's needs.

## Security Considerations

1. **Authorization**: Only team owners can manage team members
2. **Self-Protection**: Team owners cannot remove themselves from their own teams
3. **Validation**: All inputs are validated to prevent invalid operations
4. **Audit Trail**: All operations include timestamps for tracking changes

## Usage Examples

### Adding a Member
```bash
curl -X POST "http://localhost:3000/api/v1/teams/team123/members" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user456",
    "role": "member"
  }'
```

### Updating Member Role
```bash
curl -X PUT "http://localhost:3000/api/v1/teams/team123/members/member789" \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### Removing a Member
```bash
curl -X DELETE "http://localhost:3000/api/v1/teams/team123/members/member789" \
  -H "Authorization: Bearer your_token"
```

## Testing

The feature includes comprehensive tests:
- **Feature tests**: `tests/feature/team-staff.test.ts`
- **Unit tests**: `tests/unit/team-staff-service.test.ts`

Run tests with:
```bash
bun test tests/feature/team-staff.test.ts
bun test tests/unit/team-staff-service.test.ts
```
