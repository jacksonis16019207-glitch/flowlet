CREATE TABLE flowlet.m_app_setting (
    app_setting_id BIGINT PRIMARY KEY,
    month_start_day INTEGER NOT NULL,
    month_start_adjustment_rule VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_m_app_setting_month_start_day
        CHECK (month_start_day BETWEEN 1 AND 31),
    CONSTRAINT chk_m_app_setting_singleton
        CHECK (app_setting_id = 1)
);

INSERT INTO flowlet.m_app_setting (
    app_setting_id,
    month_start_day,
    month_start_adjustment_rule,
    created_at,
    updated_at
) VALUES (
    1,
    1,
    'NONE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
