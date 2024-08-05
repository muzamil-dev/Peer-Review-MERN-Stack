CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL,
    refresh_token TEXT
);

CREATE TABLE password_reset(
    email TEXT UNIQUE REFERENCES users (email) ON DELETE CASCADE,
    reset_token TEXT UNIQUE,
    reset_token_expiry TIMESTAMP WITH TIME ZONE
);

CREATE TABLE workspaces(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE groups(
    id SERIAL PRIMARY KEY,
    workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(workspace_id, name)
);

CREATE TABLE memberships(
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, workspace_id)
);

CREATE TABLE assignments(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    workspace_id INT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    started BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE questions(
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    assignment_id INT REFERENCES assignments (id) ON DELETE CASCADE
);

CREATE TABLE reviews(
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments (id) ON DELETE CASCADE,
    group_id INT REFERENCES groups (id) ON DELETE CASCADE,
    user_id INT REFERENCES users (id) ON DELETE CASCADE,
    target_id INT REFERENCES users (id) ON DELETE CASCADE,
    comment TEXT,
    UNIQUE(assignment_id, user_id, target_id)
);

CREATE TABLE ratings(
    review_id INT REFERENCES reviews (id) ON DELETE CASCADE,
    question_id INT REFERENCES questions (id) ON DELETE CASCADE,
    rating INT NOT NULL,
    PRIMARY KEY (review_id, question_id)
);

/* Drop all tables (in order) */

DROP TABLE ratings;
DROP TABLE reviews;
DROP TABLE questions;
DROP TABLE assignments;
DROP TABLE memberships;
DROP TABLE groups;
DROP TABLE workspaces;
DROP TABLE password_reset;
DROP TABLE users;