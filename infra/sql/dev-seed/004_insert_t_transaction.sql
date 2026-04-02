insert into flowlet.t_transaction (
    account_id,
    goal_bucket_id,
    category_id,
    subcategory_id,
    transaction_type,
    transaction_date,
    amount,
    description,
    note,
    transfer_group_id
)
select payload.account_id,
       payload.goal_bucket_id,
       payload.category_id,
       payload.subcategory_id,
       payload.transaction_type,
       payload.transaction_date,
       payload.amount,
       payload.description,
       payload.note,
       payload.transfer_group_id
from (
    select main.account_id as account_id,
           cast(null as bigint) as goal_bucket_id,
           salary.category_id as category_id,
           cast(null as bigint) as subcategory_id,
           'INCOME' as transaction_type,
           date '2026-04-01' as transaction_date,
           cast(320000 as numeric(19, 2)) as amount,
           '給与' as description,
           '4月給与' as note,
           cast(null as uuid) as transfer_group_id
    from flowlet.m_account main
    join flowlet.m_category salary
        on salary.category_name = '給与'
       and salary.category_type = 'INCOME'
    where main.provider_name = '住信SBIネット銀行'
      and main.account_name = 'メイン口座'
      and main.account_category = 'BANK'

    union all

    select main.account_id,
           cast(null as bigint),
           food.category_id,
           grocery.subcategory_id,
           'EXPENSE',
           date '2026-04-02',
           cast(4800 as numeric(19, 2)),
           'スーパー',
           '週末まとめ買い',
           cast(null as uuid)
    from flowlet.m_account main
    join flowlet.m_category food
        on food.category_name = '食費'
       and food.category_type = 'EXPENSE'
    join flowlet.m_subcategory grocery
        on grocery.category_id = food.category_id
       and grocery.subcategory_name = '食料品'
    where main.provider_name = '住信SBIネット銀行'
      and main.account_name = 'メイン口座'
      and main.account_category = 'BANK'

    union all

    select card.account_id,
           cast(null as bigint),
           food.category_id,
           dine.subcategory_id,
           'EXPENSE',
           date '2026-04-03',
           cast(6800 as numeric(19, 2)),
           'カード利用',
           '外食',
           cast(null as uuid)
    from flowlet.m_account card
    join flowlet.m_category food
        on food.category_name = '食費'
       and food.category_type = 'EXPENSE'
    join flowlet.m_subcategory dine
        on dine.category_id = food.category_id
       and dine.subcategory_name = '外食'
    where card.provider_name = '楽天カード'
      and card.account_name = '楽天カード'
      and card.account_category = 'CREDIT_CARD'
) as payload
where not exists (
    select 1
    from flowlet.t_transaction existing
    where existing.account_id = payload.account_id
      and existing.transaction_date = payload.transaction_date
      and existing.description = payload.description
      and existing.amount = payload.amount
);
