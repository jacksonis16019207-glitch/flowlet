comment on table flowlet.m_account is '口座マスタ';
comment on column flowlet.m_account.account_id is '口座ID';
comment on column flowlet.m_account.bank_name is '銀行名';
comment on column flowlet.m_account.account_name is '口座名';
comment on column flowlet.m_account.account_type is '口座種別';
comment on column flowlet.m_account.is_active is '有効フラグ';
comment on column flowlet.m_account.created_at is '作成日時';
comment on column flowlet.m_account.updated_at is '更新日時';

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
        ('三菱UFJ銀行', 'メイン口座', 'CHECKING', true),
        ('三菱UFJ銀行', '使い分け口座', 'CHECKING', true),
        ('PayPay銀行', 'PayPayカード引き落とし口座', 'CHECKING', true),
        ('SBI新生銀行', '普通預金', 'CHECKING', true),
        ('SBI新生銀行', 'ハイパー預金', 'SAVINGS', true)
) as seed(bank_name, account_name, account_type, is_active)
where not exists (
    select 1
    from flowlet.m_account existing
    where existing.bank_name = seed.bank_name
      and existing.account_name = seed.account_name
);
