alter table flowlet.m_account
    add column initial_balance numeric(19, 2) not null default 0;

comment on column flowlet.m_account.initial_balance is '初期残高';
