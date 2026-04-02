create table flowlet.m_category (
    category_id bigserial primary key,
    category_name varchar(100) not null,
    category_type varchar(50) not null,
    display_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint uk_m_category_category_name_category_type
        unique (category_name, category_type)
);

create table flowlet.m_subcategory (
    subcategory_id bigserial primary key,
    category_id bigint not null,
    subcategory_name varchar(100) not null,
    display_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_m_subcategory_category_id
        foreign key (category_id) references flowlet.m_category(category_id),
    constraint uk_m_subcategory_category_id_subcategory_name
        unique (category_id, subcategory_name)
);

create table flowlet.t_transaction (
    transaction_id bigserial primary key,
    account_id bigint not null,
    goal_bucket_id bigint,
    category_id bigint not null,
    subcategory_id bigint,
    transaction_type varchar(50) not null,
    transaction_date date not null,
    amount numeric(19, 2) not null,
    description varchar(100) not null,
    note varchar(500),
    transfer_group_id uuid,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_t_transaction_account_id
        foreign key (account_id) references flowlet.m_account(account_id),
    constraint fk_t_transaction_goal_bucket_id
        foreign key (goal_bucket_id) references flowlet.m_goal_bucket(goal_bucket_id),
    constraint fk_t_transaction_category_id
        foreign key (category_id) references flowlet.m_category(category_id),
    constraint fk_t_transaction_subcategory_id
        foreign key (subcategory_id) references flowlet.m_subcategory(subcategory_id)
);

create table flowlet.t_goal_bucket_allocation (
    allocation_id bigserial primary key,
    account_id bigint not null,
    from_goal_bucket_id bigint,
    to_goal_bucket_id bigint,
    allocation_date date not null,
    amount numeric(19, 2) not null,
    description varchar(100) not null,
    note varchar(500),
    linked_transfer_group_id uuid,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_t_goal_bucket_allocation_account_id
        foreign key (account_id) references flowlet.m_account(account_id),
    constraint fk_t_goal_bucket_allocation_from_goal_bucket_id
        foreign key (from_goal_bucket_id) references flowlet.m_goal_bucket(goal_bucket_id),
    constraint fk_t_goal_bucket_allocation_to_goal_bucket_id
        foreign key (to_goal_bucket_id) references flowlet.m_goal_bucket(goal_bucket_id)
);

comment on table flowlet.m_category is 'カテゴリマスタ';
comment on column flowlet.m_category.category_id is 'カテゴリID';
comment on column flowlet.m_category.category_name is 'カテゴリ名';
comment on column flowlet.m_category.category_type is 'カテゴリ種別';
comment on column flowlet.m_category.display_order is '表示順';
comment on column flowlet.m_category.is_active is '利用中フラグ';
comment on column flowlet.m_category.created_at is '作成日時';
comment on column flowlet.m_category.updated_at is '更新日時';

comment on table flowlet.m_subcategory is 'サブカテゴリマスタ';
comment on column flowlet.m_subcategory.subcategory_id is 'サブカテゴリID';
comment on column flowlet.m_subcategory.category_id is '親カテゴリID';
comment on column flowlet.m_subcategory.subcategory_name is 'サブカテゴリ名';
comment on column flowlet.m_subcategory.display_order is '表示順';
comment on column flowlet.m_subcategory.is_active is '利用中フラグ';
comment on column flowlet.m_subcategory.created_at is '作成日時';
comment on column flowlet.m_subcategory.updated_at is '更新日時';

comment on table flowlet.t_transaction is '取引明細';
comment on column flowlet.t_transaction.transaction_id is '取引ID';
comment on column flowlet.t_transaction.account_id is '口座ID';
comment on column flowlet.t_transaction.goal_bucket_id is '目的別口座ID';
comment on column flowlet.t_transaction.category_id is 'カテゴリID';
comment on column flowlet.t_transaction.subcategory_id is 'サブカテゴリID';
comment on column flowlet.t_transaction.transaction_type is '取引種別';
comment on column flowlet.t_transaction.transaction_date is '取引日';
comment on column flowlet.t_transaction.amount is '金額';
comment on column flowlet.t_transaction.description is '摘要';
comment on column flowlet.t_transaction.note is 'メモ';
comment on column flowlet.t_transaction.transfer_group_id is '振替グループID';
comment on column flowlet.t_transaction.created_at is '作成日時';
comment on column flowlet.t_transaction.updated_at is '更新日時';

comment on table flowlet.t_goal_bucket_allocation is '目的別口座配分';
comment on column flowlet.t_goal_bucket_allocation.allocation_id is '配分ID';
comment on column flowlet.t_goal_bucket_allocation.account_id is '口座ID';
comment on column flowlet.t_goal_bucket_allocation.from_goal_bucket_id is '配分元目的別口座ID';
comment on column flowlet.t_goal_bucket_allocation.to_goal_bucket_id is '配分先目的別口座ID';
comment on column flowlet.t_goal_bucket_allocation.allocation_date is '配分日';
comment on column flowlet.t_goal_bucket_allocation.amount is '金額';
comment on column flowlet.t_goal_bucket_allocation.description is '摘要';
comment on column flowlet.t_goal_bucket_allocation.note is 'メモ';
comment on column flowlet.t_goal_bucket_allocation.linked_transfer_group_id is '連携振替グループID';
comment on column flowlet.t_goal_bucket_allocation.created_at is '作成日時';
comment on column flowlet.t_goal_bucket_allocation.updated_at is '更新日時';
