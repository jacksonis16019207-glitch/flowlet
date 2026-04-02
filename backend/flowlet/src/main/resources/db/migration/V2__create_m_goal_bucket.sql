create table flowlet.m_goal_bucket (
    goal_bucket_id bigserial primary key,
    account_id bigint not null,
    bucket_name varchar(100) not null,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_m_goal_bucket_account_id
        foreign key (account_id) references flowlet.m_account(account_id),
    constraint uk_m_goal_bucket_account_id_bucket_name
        unique (account_id, bucket_name)
);

comment on table flowlet.m_goal_bucket is '目的別口座マスタ';
comment on column flowlet.m_goal_bucket.goal_bucket_id is '目的別口座ID';
comment on column flowlet.m_goal_bucket.account_id is '親口座ID';
comment on column flowlet.m_goal_bucket.bucket_name is '目的別口座名';
comment on column flowlet.m_goal_bucket.is_active is '利用中フラグ';
comment on column flowlet.m_goal_bucket.created_at is '作成日時';
comment on column flowlet.m_goal_bucket.updated_at is '更新日時';
