comment on table flowlet.m_account is 'Account master';
comment on column flowlet.m_account.account_id is 'Account ID';
comment on column flowlet.m_account.bank_name is 'Bank name';
comment on column flowlet.m_account.account_name is 'Account name';
comment on column flowlet.m_account.account_type is 'Account type';
comment on column flowlet.m_account.is_active is 'Active flag';
comment on column flowlet.m_account.created_at is 'Created at';
comment on column flowlet.m_account.updated_at is 'Updated at';

insert into flowlet.m_account (
    bank_name,
    account_name,
    account_type,
    is_active
)
select seed.bank_name,
       seed.account_name,
       seed.account_type,
       seed.is_active
from (
    values
        ('メイン銀行', '生活口座', 'CHECKING', true),
        ('メイン銀行', '使い分け口座', 'CHECKING', true),
        ('決済用銀行', '固定費口座', 'CHECKING', true),
        ('貯蓄用銀行', '普通預金', 'CHECKING', true),
        ('貯蓄用銀行', '貯蓄口座', 'SAVINGS', true)
) as seed(bank_name, account_name, account_type, is_active)
where not exists (
    select 1
    from flowlet.m_account existing
    where existing.bank_name = seed.bank_name
      and existing.account_name = seed.account_name
);
