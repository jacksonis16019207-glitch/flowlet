create schema if not exists flowlet_backup_v4;

create table if not exists flowlet_backup_v4.m_account as
select *
from flowlet.m_account;

alter table flowlet.m_account
    add column initial_balance numeric(19, 2) not null default 0;

comment on column flowlet.m_account.initial_balance is '初期残高';
