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
           salary_detail.subcategory_id as subcategory_id,
           'INCOME' as transaction_type,
           date '2026-04-01' as transaction_date,
           cast(120000 as numeric(19, 2)) as amount,
           '月初の入金' as description,
           '公開用サンプル' as note,
           cast(null as uuid) as transfer_group_id
    from flowlet.m_account main
    join flowlet.m_category salary
        on salary.category_name = '給与'
       and salary.category_type = 'INCOME'
    join flowlet.m_subcategory salary_detail
        on salary_detail.category_id = salary.category_id
       and salary_detail.subcategory_name = '基本給'
    where main.provider_name = 'メイン銀行'
      and main.account_name = '生活口座'
      and main.account_category = 'BANK'

    union all

    select main.account_id,
           cast(null as bigint),
           food.category_id,
           grocery.subcategory_id,
           'EXPENSE',
           date '2026-04-02',
           cast(5800 as numeric(19, 2)),
           '食料品の購入',
           '公開用サンプル',
           cast(null as uuid)
    from flowlet.m_account main
    join flowlet.m_category food
        on food.category_name = '食費'
       and food.category_type = 'EXPENSE'
    join flowlet.m_subcategory grocery
        on grocery.category_id = food.category_id
       and grocery.subcategory_name = '食料品'
    where main.provider_name = 'メイン銀行'
      and main.account_name = '生活口座'
      and main.account_category = 'BANK'

    union all

    select living.account_id,
           cast(null as bigint),
           transfer.category_id,
           savings_move.subcategory_id,
           'TRANSFER_OUT',
           date '2026-04-03',
           cast(40000 as numeric(19, 2)),
           '積立口座へ振替',
           '公開用サンプル',
           cast('11111111-1111-1111-1111-111111111111' as uuid)
    from flowlet.m_account living
    join flowlet.m_category transfer
        on transfer.category_name = '口座間移動'
       and transfer.category_type = 'TRANSFER'
    join flowlet.m_subcategory savings_move
        on savings_move.category_id = transfer.category_id
       and savings_move.subcategory_name = '貯蓄口座へ移動'
    where living.provider_name = 'メイン銀行'
      and living.account_name = '生活口座'
      and living.account_category = 'BANK'

    union all

    select savings.account_id,
           cast(null as bigint),
           transfer.category_id,
           savings_move.subcategory_id,
           'TRANSFER_IN',
           date '2026-04-03',
           cast(40000 as numeric(19, 2)),
           '積立口座へ振替',
           '公開用サンプル',
           cast('11111111-1111-1111-1111-111111111111' as uuid)
    from flowlet.m_account savings
    join flowlet.m_category transfer
        on transfer.category_name = '口座間移動'
       and transfer.category_type = 'TRANSFER'
    join flowlet.m_subcategory savings_move
        on savings_move.category_id = transfer.category_id
       and savings_move.subcategory_name = '貯蓄口座へ移動'
    where savings.provider_name = '貯蓄用銀行'
      and savings.account_name = '積立口座'
      and savings.account_category = 'BANK'

    union all

    select card.account_id,
           cast(null as bigint),
           food.category_id,
           dine.subcategory_id,
           'EXPENSE',
           date '2026-04-04',
           cast(12800 as numeric(19, 2)),
           'カードで外食',
           '公開用サンプル',
           cast(null as uuid)
    from flowlet.m_account card
    join flowlet.m_category food
        on food.category_name = '食費'
       and food.category_type = 'EXPENSE'
    join flowlet.m_subcategory dine
        on dine.category_id = food.category_id
       and dine.subcategory_name = '外食'
    where card.provider_name = 'サンプルカード'
      and card.account_name = '支払カード'
      and card.account_category = 'CREDIT_CARD'

    union all

    select living.account_id,
           cast(null as bigint),
           card_payment.category_id,
           card_payment_detail.subcategory_id,
           'TRANSFER_OUT',
           date '2026-04-06',
           cast(12800 as numeric(19, 2)),
           'カード支払い',
           '公開用サンプル',
           cast('22222222-2222-2222-2222-222222222222' as uuid)
    from flowlet.m_account living
    join flowlet.m_category card_payment
        on card_payment.category_name = 'カード引落'
       and card_payment.category_type = 'TRANSFER'
    join flowlet.m_subcategory card_payment_detail
        on card_payment_detail.category_id = card_payment.category_id
       and card_payment_detail.subcategory_name = 'クレジットカード支払い'
    where living.provider_name = 'メイン銀行'
      and living.account_name = '生活口座'
      and living.account_category = 'BANK'

    union all

    select card.account_id,
           cast(null as bigint),
           card_payment.category_id,
           card_payment_detail.subcategory_id,
           'TRANSFER_IN',
           date '2026-04-06',
           cast(12800 as numeric(19, 2)),
           'カード支払い',
           '公開用サンプル',
           cast('22222222-2222-2222-2222-222222222222' as uuid)
    from flowlet.m_account card
    join flowlet.m_category card_payment
        on card_payment.category_name = 'カード引落'
       and card_payment.category_type = 'TRANSFER'
    join flowlet.m_subcategory card_payment_detail
        on card_payment_detail.category_id = card_payment.category_id
       and card_payment_detail.subcategory_name = 'クレジットカード支払い'
    where card.provider_name = 'サンプルカード'
      and card.account_name = '支払カード'
      and card.account_category = 'CREDIT_CARD'

    union all

    select savings.account_id,
           travel_bucket.goal_bucket_id,
           travel.category_id,
           stay.subcategory_id,
           'EXPENSE',
           date '2026-04-07',
           cast(6000 as numeric(19, 2)),
           '旅行の前払い',
           '公開用サンプル',
           cast(null as uuid)
    from flowlet.m_account savings
    join flowlet.m_goal_bucket travel_bucket
        on travel_bucket.account_id = savings.account_id
       and travel_bucket.bucket_name = '旅行'
    join flowlet.m_category travel
        on travel.category_name = '旅行'
       and travel.category_type = 'EXPENSE'
    join flowlet.m_subcategory stay
        on stay.category_id = travel.category_id
       and stay.subcategory_name = '宿泊'
    where savings.provider_name = '貯蓄用銀行'
      and savings.account_name = '積立口座'
      and savings.account_category = 'BANK'
) as payload
where not exists (
    select 1
    from flowlet.t_transaction existing
    where existing.account_id = payload.account_id
      and existing.transaction_date = payload.transaction_date
      and existing.description = payload.description
      and existing.amount = payload.amount
);
