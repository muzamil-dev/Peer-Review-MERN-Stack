create table temp_users(
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    verification_token TEXT UNIQUE,
    verification_token_expiry TIMESTAMP WITH TIME ZONE
);

create table users(
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    refresh_token TEXT
);

create table password_reset(
    email TEXT UNIQUE REFERENCES users (email) ON DELETE CASCADE,
    reset_token TEXT UNIQUE,
    reset_token_expiry TIMESTAMP WITH TIME ZONE
);

create table workspaces(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT,
    allowed_domains TEXT[],
    groups_created INT NOT NULL DEFAULT 0,
    group_member_limit INT,
    groups_locked BOOLEAN NOT NULL default false
);

create table groups(
    id serial primary key,
    name text not null,
    workspace_id int not null references workspaces (id) ON DELETE CASCADE
);

create table memberships(
    user_id int references users (id) ON DELETE CASCADE,
    workspace_id int references workspaces (id) ON DELETE CASCADE,
    group_id int references groups (id) on delete set null,
    role text not null,
    primary key (user_id, workspace_id)
);

CREATE TABLE assignments(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    workspace_id INT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    started BOOLEAN NOT NULL DEFAULT false,
    completed BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE reviews(
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments (id) ON DELETE CASCADE,
    group_id INT REFERENCES groups (id) ON DELETE CASCADE,
    user_id INT REFERENCES users (id) ON DELETE CASCADE,
    target_id INT REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(assignment_id, user_id, target_id)
);

CREATE TABLE questions(
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    assignment_id INT REFERENCES assignments (id) ON DELETE CASCADE
);

CREATE TABLE ratings(
    review_id INT REFERENCES reviews (id) ON DELETE CASCADE,
    question_id INT REFERENCES questions (id) ON DELETE CASCADE,
    rating INT NOT NULL,
    PRIMARY KEY (review_id, question_id)
);

CREATE TABLE analytics(
    user_id INT REFERENCES users (id) ON DELETE CASCADE,
    assignment_id INT REFERENCES assignments (id) ON DELETE CASCADE,
    average_rating NUMERIC,
    PRIMARY KEY (user_id, assignment_id)
);