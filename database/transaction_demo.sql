-- Demonstration of BEGIN / COMMIT / ROLLBACK (run after "npm run db:setup").
-- A sale with two items where item 2 asks for more boxes than exist: everything is undone.
USE batloung_farm;

SELECT fruit_id, packaging_size, available_quantity FROM stock WHERE fruit_id = 1;   -- before

BEGIN;
INSERT INTO sales (vendor_id, payment_status, payment_method) VALUES (1, 'UNPAID', 'CREDIT');
SET @sale_id = LAST_INSERT_ID();

-- item 1: 2 medium apples -> OK
UPDATE stock SET available_quantity = available_quantity - 2
 WHERE fruit_id = 1 AND packaging_size = 'MEDIUM' AND available_quantity >= 2;
SELECT ROW_COUNT() AS item1_rows_updated;                                            -- 1 = ok

-- item 2: 10 large apples but only 6 exist -> guarded update changes 0 rows = FAILURE
UPDATE stock SET available_quantity = available_quantity - 10
 WHERE fruit_id = 1 AND packaging_size = 'LARGE' AND available_quantity >= 10;
SELECT ROW_COUNT() AS item2_rows_updated;                                            -- 0 = fail

ROLLBACK;   -- the application issues ROLLBACK because item 2 failed (COMMIT only if every item passed)

SELECT fruit_id, packaging_size, available_quantity FROM stock WHERE fruit_id = 1;   -- identical to "before"
SELECT COUNT(*) AS sales_rows_for_new_id FROM sales WHERE sale_id = @sale_id;        -- 0
