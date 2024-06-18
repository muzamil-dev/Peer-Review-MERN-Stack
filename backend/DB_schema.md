## Database Schema

### Users Collection
```json
{
  "id": "unique_id",
  "firstname": "string",
  "lastname": "string",
  "email": "string",
  "password": "string",
  "workspace_ids": ["workspace_id1", "workspace_id2"],
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Workspaces Collection
```json
{
  "id": "unique_id",
  "name": "string",
  "member_ids": ["user_id1", "user_id2"],
  "role_ids": ["role_id1", "role_id2"],
  "group_ids": ["group_id1", "group_id2"],
  "allowedDomains": ["allowedDomain1", "allowedDomain2"],
  "inviteCode": "string",
  "inviteCodeExpiry": "date"
}
```

### Roles Collection
```json
{
  "id": "unique_id",
  "name": "string",
  "workspace_id": "workspace_id",
  "permission_ids": ["permission_id1", "permission_id2"],
  "member_ids": ["user_id1", "user_id2"]
}
```

### Permissions Collection
```json
{
  "id": "unique_id",
  "name": "string",
  "description": "string",
  "apiEndpoint": "string"
}
```

### Groups Collection
```json
{
  "id": "unique_id",
  "name": "string",
  "workspace_id": "workspace_id",
  "member_ids": ["user_id1", "user_id2"]
}
```

### Comments Collection
```json
{
  "id": "unique_id",
  "owner_id": "user_id",
  "target_id": "user_id",
  "workspace_id": "workspace_id",
  "ratings": [{ "category": "string", "rating": "integer" }],
  "text": "string",
  "createdAt": "date"
}
```