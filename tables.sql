CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL,
    refresh_token TEXT
);

CREATE TABLE workspaces(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE memberships(
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, workspace_id)
);

CREATE TABLE groups(
    id SERIAL PRIMARY KEY,
    workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(workspace_id, name)
);

/* Drop all tables (in order) */

DROP TABLE memberships;
DROP TABLE workspaces;
DROP TABLE users;