insert into flowlet.m_category (
    category_name,
    category_type,
    display_order,
    is_active
)
select seed.category_name,
       seed.category_type,
       seed.display_order,
       seed.is_active
from (
    values
        ('給与', 'INCOME', 10, true),
        ('食費', 'EXPENSE', 20, true),
        ('交通費', 'EXPENSE', 30, true),
        ('振替', 'TRANSFER', 40, true)
) as seed(category_name, category_type, display_order, is_active)
where not exists (
    select 1
    from flowlet.m_category existing
    where existing.category_name = seed.category_name
      and existing.category_type = seed.category_type
);
