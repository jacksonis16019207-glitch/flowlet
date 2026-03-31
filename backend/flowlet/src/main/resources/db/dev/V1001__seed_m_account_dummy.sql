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
        ('みらい銀行', '生活口座', 'CHECKING', true),
        ('みらい銀行', '支出口座', 'CHECKING', true),
        ('ひかり貯蓄銀行', '緊急積立', 'SAVINGS', true),
        ('まいにちウォレット', '現金管理', 'CHECKING', true),
        ('そらたび積立', '旅行積立', 'SAVINGS', false)
) as seed(bank_name, account_name, account_type, is_active)
where not exists (
    select 1
    from flowlet.m_account existing
    where existing.bank_name = seed.bank_name
      and existing.account_name = seed.account_name
);
