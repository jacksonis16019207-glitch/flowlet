create schema if not exists flowlet;

create table flowlet.m_account (
    account_id bigserial primary key,
    bank_name varchar(100) not null,
    account_name varchar(100) not null,
    account_type varchar(50) not null,
    is_active boolean not null default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

comment on table flowlet.m_account is '実口座マスタ';
comment on column flowlet.m_account.account_id is '口座ID';
comment on column flowlet.m_account.bank_name is '銀行名';
comment on column flowlet.m_account.account_name is '口座名';
comment on column flowlet.m_account.account_type is '口座種別';
comment on column flowlet.m_account.is_active is '有効フラグ';
comment on column flowlet.m_account.created_at is '作成日時';
comment on column flowlet.m_account.updated_at is '更新日時';
