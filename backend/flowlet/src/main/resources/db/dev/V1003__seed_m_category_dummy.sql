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

insert into flowlet.m_subcategory (
    category_id,
    subcategory_name,
    display_order,
    is_active
)
select category.category_id,
       seed.subcategory_name,
       seed.display_order,
       seed.is_active
from (
    values
        ('食費', 'EXPENSE', '食料品', 10, true),
        ('食費', 'EXPENSE', 'コンビニ', 20, true),
        ('食費', 'EXPENSE', '外食', 30, true),
        ('交通費', 'EXPENSE', '電車', 10, true),
        ('交通費', 'EXPENSE', 'バス', 20, true),
        ('振替', 'TRANSFER', '口座間移動', 10, true),
        ('振替', 'TRANSFER', 'カード支払', 20, true)
) as seed(category_name, category_type, subcategory_name, display_order, is_active)
join flowlet.m_category category
    on category.category_name = seed.category_name
   and category.category_type = seed.category_type
where not exists (
    select 1
    from flowlet.m_subcategory existing
    where existing.category_id = category.category_id
      and existing.subcategory_name = seed.subcategory_name
  );
