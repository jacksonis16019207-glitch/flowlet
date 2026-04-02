create schema if not exists flowlet_backup_v4;

create table if not exists flowlet_backup_v4.m_account as
select *
from flowlet.m_account;

create table if not exists flowlet_backup_v4.m_credit_card_profile as
select *
from flowlet.m_credit_card_profile;

alter table flowlet.m_goal_bucket
    drop constraint if exists fk_m_goal_bucket_account_id;

alter table flowlet.t_transaction
    drop constraint if exists fk_t_transaction_account_id;

alter table flowlet.t_goal_bucket_allocation
    drop constraint if exists fk_t_goal_bucket_allocation_account_id;

drop table if exists flowlet.m_credit_card_profile;
drop table if exists flowlet.m_account;

create table flowlet.m_account (
    account_id bigserial primary key,
    provider_name varchar(100) not null,
    account_name varchar(100) not null,
    account_category varchar(50) not null,
    balance_side varchar(50) not null,
    initial_balance numeric(19, 2) not null default 0,
    is_active boolean not null default true,
    display_order integer not null default 0,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint uk_m_account_provider_name_account_name_account_category
        unique (provider_name, account_name, account_category)
);

insert into flowlet.m_account (
    account_id,
    provider_name,
    account_name,
    account_category,
    balance_side,
    initial_balance,
    is_active,
    display_order,
    created_at,
    updated_at
)
select account_id,
       provider_name,
       account_name,
       account_category,
       balance_side,
       0,
       is_active,
       display_order,
       created_at,
       updated_at
from flowlet_backup_v4.m_account;

create table flowlet.m_credit_card_profile (
    account_id bigint primary key,
    payment_account_id bigint not null,
    closing_day integer not null,
    payment_day integer not null,
    payment_date_adjustment_rule varchar(50) not null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_m_credit_card_profile_account_id
        foreign key (account_id) references flowlet.m_account(account_id),
    constraint fk_m_credit_card_profile_payment_account_id
        foreign key (payment_account_id) references flowlet.m_account(account_id)
);

insert into flowlet.m_credit_card_profile (
    account_id,
    payment_account_id,
    closing_day,
    payment_day,
    payment_date_adjustment_rule,
    created_at,
    updated_at
)
select account_id,
       payment_account_id,
       closing_day,
       payment_day,
       payment_date_adjustment_rule,
       created_at,
       updated_at
from flowlet_backup_v4.m_credit_card_profile;

alter table flowlet.m_goal_bucket
    add constraint fk_m_goal_bucket_account_id
        foreign key (account_id) references flowlet.m_account(account_id);

alter table flowlet.t_transaction
    add constraint fk_t_transaction_account_id
        foreign key (account_id) references flowlet.m_account(account_id);

alter table flowlet.t_goal_bucket_allocation
    add constraint fk_t_goal_bucket_allocation_account_id
        foreign key (account_id) references flowlet.m_account(account_id);

comment on table flowlet.m_account is '管理対象口座マスタ';
comment on column flowlet.m_account.account_id is '口座ID';
comment on column flowlet.m_account.provider_name is '提供元名';
comment on column flowlet.m_account.account_name is '口座名';
comment on column flowlet.m_account.account_category is '口座区分';
comment on column flowlet.m_account.balance_side is '残高区分';
comment on column flowlet.m_account.initial_balance is '初期残高';
comment on column flowlet.m_account.is_active is '利用中フラグ';
comment on column flowlet.m_account.display_order is '表示順';
comment on column flowlet.m_account.created_at is '作成日時';
comment on column flowlet.m_account.updated_at is '更新日時';

comment on table flowlet.m_credit_card_profile is 'クレジットカード固有情報';
comment on column flowlet.m_credit_card_profile.account_id is 'カード口座ID';
comment on column flowlet.m_credit_card_profile.payment_account_id is '引き落とし元口座ID';
comment on column flowlet.m_credit_card_profile.closing_day is '締め日';
comment on column flowlet.m_credit_card_profile.payment_day is '支払日';
comment on column flowlet.m_credit_card_profile.payment_date_adjustment_rule is '支払日調整ルール';
comment on column flowlet.m_credit_card_profile.created_at is '作成日時';
comment on column flowlet.m_credit_card_profile.updated_at is '更新日時';
