alter table flowlet.t_transaction
    add column cashflow_treatment varchar(50) not null default 'AUTO';

comment on column flowlet.t_transaction.cashflow_treatment is '収支集計への反映区分';
