insert into flowlet.t_goal_bucket_allocation (
    account_id,
    from_goal_bucket_id,
    to_goal_bucket_id,
    allocation_date,
    amount,
    description,
    note,
    linked_transfer_group_id
) 
select payload.account_id,
       payload.from_goal_bucket_id,
       payload.to_goal_bucket_id,
       payload.allocation_date,
       payload.amount,
       payload.description,
       payload.note,
       payload.linked_transfer_group_id
from (
    select savings.account_id,
           cast(null as bigint) as from_goal_bucket_id,
           travel.goal_bucket_id as to_goal_bucket_id,
           date '2026-04-03' as allocation_date,
           cast(25000 as numeric(19, 2)) as amount,
           '積立口座の初回配分' as description,
           '旅行用の配分' as note,
           cast('11111111-1111-1111-1111-111111111111' as uuid) as linked_transfer_group_id
    from flowlet.m_account savings
    join flowlet.m_goal_bucket travel
        on travel.account_id = savings.account_id
       and travel.bucket_name = '旅行'
    where savings.provider_name = '貯蓄用銀行'
      and savings.account_name = '積立口座'
      and savings.account_category = 'BANK'

    union all

    select savings.account_id,
           cast(null as bigint),
           special.goal_bucket_id,
           date '2026-04-03',
           cast(10000 as numeric(19, 2)),
           '積立口座の初回配分',
           '特別費の配分',
           cast('11111111-1111-1111-1111-111111111111' as uuid)
    from flowlet.m_account savings
    join flowlet.m_goal_bucket special
        on special.account_id = savings.account_id
       and special.bucket_name = '特別費'
    where savings.provider_name = '貯蓄用銀行'
      and savings.account_name = '積立口座'
      and savings.account_category = 'BANK'

    union all

    select living.account_id,
           cast(null as bigint),
           regular.goal_bucket_id,
           date '2026-04-05',
           cast(15000 as numeric(19, 2)),
           '生活口座の配分',
           '定期支払の準備',
           cast(null as uuid)
    from flowlet.m_account living
    join flowlet.m_goal_bucket regular
        on regular.account_id = living.account_id
       and regular.bucket_name = '定期支払'
    where living.provider_name = 'メイン銀行'
      and living.account_name = '生活口座'
      and living.account_category = 'BANK'

    union all

    select living.account_id,
           cast(null as bigint),
           event_bucket.goal_bucket_id,
           date '2026-04-05',
           cast(8000 as numeric(19, 2)),
           '生活口座の配分',
           '生活イベントの準備',
           cast(null as uuid)
    from flowlet.m_account living
    join flowlet.m_goal_bucket event_bucket
        on event_bucket.account_id = living.account_id
       and event_bucket.bucket_name = '生活イベント'
    where living.provider_name = 'メイン銀行'
      and living.account_name = '生活口座'
      and living.account_category = 'BANK'
) as payload
where not exists (
    select 1
    from flowlet.t_goal_bucket_allocation existing
    where existing.to_goal_bucket_id = payload.to_goal_bucket_id
      and existing.allocation_date = payload.allocation_date
      and existing.amount = payload.amount
);
