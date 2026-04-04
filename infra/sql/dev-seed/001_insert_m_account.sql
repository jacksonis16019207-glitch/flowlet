insert into flowlet.m_account (
    provider_name,
    account_name,
    account_category,
    balance_side,
    initial_balance,
    is_active,
    display_order
)
select seed.provider_name,
       seed.account_name,
       seed.account_category,
       seed.balance_side,
       seed.initial_balance,
       seed.is_active,
       seed.display_order
from (
    values
        ('メイン銀行', '生活口座', 'BANK', 'ASSET', 180000, true, 10),
        ('貯蓄用銀行', '積立口座', 'BANK', 'ASSET', 90000, true, 20),
        ('サンプルカード', '支払カード', 'CREDIT_CARD', 'LIABILITY', 0, true, 30),
        ('現金', '財布', 'CASH', 'ASSET', 12000, true, 40)
) as seed(provider_name, account_name, account_category, balance_side, initial_balance, is_active, display_order)
where not exists (
    select 1
    from flowlet.m_account existing
    where existing.provider_name = seed.provider_name
      and existing.account_name = seed.account_name
      and existing.account_category = seed.account_category
);
