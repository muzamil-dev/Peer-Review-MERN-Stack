create table users(
    id serial primary key,
    first_name text not null,
    last_name text not null,
    email text unique not null,
    password text not null
);

create table workspaces(
    id serial primary key,
    name text not null,
    groups_created int not null default 0
);

create table groups(
    id serial primary key,
    name text not null,
    workspace_id int not null references workspaces (id) on delete cascade
);

create table memberships(
    user_id int references users (id) on delete cascade,
    workspace_id int references workspaces (id) on delete cascade,
    group_id int references groups (id) on delete set null,
    role text not null,
    primary key (user_id, workspace_id)
);