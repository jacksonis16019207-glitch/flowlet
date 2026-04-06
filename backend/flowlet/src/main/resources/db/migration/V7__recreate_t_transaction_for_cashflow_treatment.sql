create schema if not exists flowlet_backup_v7;

create table flowlet_backup_v7.t_transaction_backup as
table flowlet.t_transaction;

drop table flowlet.t_transaction;

create table flowlet.t_transaction (
    transaction_id bigserial primary key,
    account_id bigint not null,
    goal_bucket_id bigint,
    category_id bigint not null,
    subcategory_id bigint,
    transaction_type varchar(50) not null,
    cashflow_treatment varchar(50) not null,
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

insert into flowlet.t_transaction (
    transaction_id,
    account_id,
    goal_bucket_id,
    category_id,
    subcategory_id,
    transaction_type,
    cashflow_treatment,
    transaction_date,
    amount,
    description,
    note,
    transfer_group_id,
    created_at,
    updated_at
)
select
    transaction_id,
    account_id,
    goal_bucket_id,
    category_id,
    subcategory_id,
    transaction_type,
    cashflow_treatment,
    transaction_date,
    amount,
    description,
    note,
    transfer_group_id,
    created_at,
    updated_at
from flowlet_backup_v7.t_transaction_backup;

alter sequence if exists flowlet.t_transaction_transaction_id_seq
    restart with 1000000000;

comment on table flowlet.t_transaction is '取引明細';
comment on column flowlet.t_transaction.transaction_id is '取引ID';
comment on column flowlet.t_transaction.account_id is '口座ID';
comment on column flowlet.t_transaction.goal_bucket_id is '目的別口座ID';
comment on column flowlet.t_transaction.category_id is 'カテゴリID';
comment on column flowlet.t_transaction.subcategory_id is 'サブカテゴリID';
comment on column flowlet.t_transaction.transaction_type is '取引種別';
comment on column flowlet.t_transaction.cashflow_treatment is '収支集計への反映区分';
comment on column flowlet.t_transaction.transaction_date is '取引日';
comment on column flowlet.t_transaction.amount is '金額';
comment on column flowlet.t_transaction.description is '摘要';
comment on column flowlet.t_transaction.note is 'メモ';
comment on column flowlet.t_transaction.transfer_group_id is '振替グループID';
comment on column flowlet.t_transaction.created_at is '作成日時';
comment on column flowlet.t_transaction.updated_at is '更新日時';
