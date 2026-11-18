USE batloung_farm;

-- Safe to rerun: master data is kept, and sample transactions are only added to empty tables.
SET @seed_purchases_exist = EXISTS (SELECT 1 FROM purchases);
SET @seed_sales_exist = EXISTS (SELECT 1 FROM sales);

INSERT IGNORE INTO suppliers (business_name, contact_person, phone, province, address) VALUES
('Joburg Fresh Produce',      'Thabo Mokoena',  '+27110001111', 'Gauteng',       '12 Market Street, City Deep, Johannesburg'),
('Free State Orchards',       'Anja van Wyk',   '+27510002222', 'Free State',    'Farm 7, Ficksburg Road, Ficksburg'),
('Durban Tropical Farms',     'Sipho Dlamini',  '+27310003333', 'KwaZulu-Natal', '45 Banana Lane, Port Shepstone'),
('Cape Fruit Growers',        'Lindiwe Jacobs', '+27210004444', 'Western Cape',  '3 Vineyard Road, Paarl'),
('Limpopo Mango Estate',      'Kagiso Maluleke','+27150005555', 'Limpopo',       'Letsitele Valley, Tzaneen'),
('Mpumalanga Citrus Co-op',   'Johan Botha',    '+27130006666', 'Mpumalanga',    'Citrus Park, Nelspruit'),
('Eastern Cape Fruit Traders','Nomsa Ndlovu',   '+27430007777', 'Eastern Cape',  '9 Harbour Road, East London');

INSERT IGNORE INTO fruits (fruit_name, description, status) VALUES
('Apples',  'Crisp red and green apples',    'ACTIVE'),
('Bananas', 'Sweet ripe bananas',            'ACTIVE'),
('Oranges', 'Juicy navel oranges',           'ACTIVE'),
('Mangoes', 'Tommy Atkins and Kent mangoes', 'ACTIVE'),
('Grapes',  'Seedless table grapes',         'ACTIVE');

INSERT IGNORE INTO vendors (vendor_name, phone_number, location, registration_date) VALUES
('Mpho Letsie',       '+26658001001', 'Maseru Central Market',  '2026-01-15'),
('Palesa Mohapi',     '+26658001002', 'Maseru Bus Station',     '2026-02-03'),
('Teboho Mofokeng',   '+26658001003', 'Maseru Pitso Ground',    '2026-02-20'),
('Mamello Khoase',    '+26658001004', 'Maseru Sebaboleng',      '2026-03-11'),
('Lerato Ramokhele',  '+26658001005', 'Maseru Thetsane',        '2026-04-02'),
('Tumelo Nkhahle',    '+26658001006', 'Maseru Qoaling',         '2026-05-18');

-- Selling price per box: every packaging size has a different price
INSERT IGNORE INTO selling_prices (fruit_id, packaging_size, unit_price) VALUES
(1,'SMALL',110),(1,'MEDIUM',155),(1,'LARGE',205),
(2,'SMALL', 80),(2,'MEDIUM',115),(2,'LARGE',150),
(3,'SMALL', 95),(3,'MEDIUM',130),(3,'LARGE',175),
(4,'SMALL',140),(4,'MEDIUM',190),(4,'LARGE',250),
(5,'SMALL',170),(5,'MEDIUM',230),(5,'LARGE',300);

-- One stock row for every fruit x packaging size (filled in below)
INSERT IGNORE INTO stock (fruit_id, packaging_size, available_quantity)
SELECT f.fruit_id, s.size, 0
FROM fruits f CROSS JOIN (SELECT 'SMALL' AS size UNION SELECT 'MEDIUM' UNION SELECT 'LARGE') s;

INSERT INTO purchases (supplier_id, purchase_date)
SELECT supplier_id, purchase_date
FROM (
  SELECT 2 AS supplier_id, '2026-10-01 08:30:00' AS purchase_date
  UNION ALL SELECT 3, '2026-10-02 09:00:00'
  UNION ALL SELECT 5, '2026-10-03 10:15:00'
  UNION ALL SELECT 6, '2026-10-04 07:45:00'
  UNION ALL SELECT 4, '2026-10-05 11:00:00'
) AS sample_purchases
WHERE @seed_purchases_exist = 0;

INSERT INTO purchase_details (purchase_id, fruit_id, packaging_size, quantity, unit_cost)
SELECT purchase_id, fruit_id, packaging_size, quantity, unit_cost
FROM (
  SELECT 1 AS purchase_id,1 AS fruit_id,'SMALL' AS packaging_size,40 AS quantity,85 AS unit_cost
  UNION ALL SELECT 1,1,'MEDIUM',50,120
  UNION ALL SELECT 1,1,'LARGE',30,160
  UNION ALL SELECT 2,2,'SMALL',30,60
  UNION ALL SELECT 2,2,'MEDIUM',40,90
  UNION ALL SELECT 2,2,'LARGE',20,120
  UNION ALL SELECT 3,4,'SMALL',20,110
  UNION ALL SELECT 3,4,'MEDIUM',30,150
  UNION ALL SELECT 3,4,'LARGE',15,200
  UNION ALL SELECT 4,3,'SMALL',40,70
  UNION ALL SELECT 4,3,'MEDIUM',45,100
  UNION ALL SELECT 4,3,'LARGE',25,140
  UNION ALL SELECT 5,5,'SMALL',10,130
  UNION ALL SELECT 5,5,'MEDIUM',12,180
  UNION ALL SELECT 5,5,'LARGE',8,240
) AS sample_purchase_details
WHERE @seed_purchases_exist = 0;

UPDATE purchases p SET total_amount =
  (SELECT SUM(quantity * unit_cost) FROM purchase_details d WHERE d.purchase_id = p.purchase_id);

INSERT INTO sales (vendor_id, sale_date, payment_status, payment_method)
SELECT vendor_id, sale_date, payment_status, payment_method
FROM (
  SELECT 1 AS vendor_id,'2026-10-06 09:00:00' AS sale_date,'PAID' AS payment_status,'CASH' AS payment_method
  UNION ALL SELECT 2,'2026-10-07 10:30:00','PARTIALLY_PAID','CASH'
  UNION ALL SELECT 3,'2026-10-08 12:00:00','UNPAID','CREDIT'
  UNION ALL SELECT 4,'2026-10-09 08:20:00','PAID','MOBILE_MONEY'
  UNION ALL SELECT 5,'2026-10-10 14:10:00','PARTIALLY_PAID','MOBILE_MONEY'
  UNION ALL SELECT 2,'2026-10-11 09:40:00','UNPAID','CREDIT'
) AS sample_sales
WHERE @seed_sales_exist = 0;

INSERT INTO sales_details (sale_id, fruit_id, packaging_size, quantity, unit_price)
SELECT sale_id, fruit_id, packaging_size, quantity, unit_price
FROM (
  SELECT 1 AS sale_id,1 AS fruit_id,'LARGE' AS packaging_size,10 AS quantity,205 AS unit_price
  UNION ALL SELECT 1,1,'MEDIUM',10,155
  UNION ALL SELECT 2,2,'SMALL',10,80
  UNION ALL SELECT 2,3,'MEDIUM',15,130
  UNION ALL SELECT 3,4,'LARGE',5,250
  UNION ALL SELECT 3,5,'SMALL',8,170
  UNION ALL SELECT 4,1,'LARGE',14,205
  UNION ALL SELECT 5,3,'LARGE',20,175
  UNION ALL SELECT 5,2,'LARGE',10,150
  UNION ALL SELECT 6,5,'MEDIUM',4,230
) AS sample_sales_details
WHERE @seed_sales_exist = 0;

UPDATE sales s SET total_amount =
  (SELECT SUM(quantity * unit_price) FROM sales_details d WHERE d.sale_id = s.sale_id);
UPDATE sales SET amount_paid = total_amount WHERE payment_status = 'PAID';
UPDATE sales SET amount_paid = 500
WHERE vendor_id = 2 AND sale_date = '2026-10-07 10:30:00' AND @seed_sales_exist = 0;
UPDATE sales SET amount_paid = 1000
WHERE vendor_id = 5 AND sale_date = '2026-10-10 14:10:00' AND @seed_sales_exist = 0;

INSERT INTO payments (sale_id, amount, payment_method, reference, paid_at)
SELECT sale_id, amount_paid, payment_method, NULL, sale_date
FROM sales WHERE amount_paid > 0 AND @seed_sales_exist = 0;

-- Stock = everything purchased - everything sold, per fruit and packaging size
UPDATE stock st SET available_quantity =
    COALESCE((SELECT SUM(quantity) FROM purchase_details pd
              WHERE pd.fruit_id = st.fruit_id AND pd.packaging_size = st.packaging_size), 0)
  - COALESCE((SELECT SUM(quantity) FROM sales_details sd
              WHERE sd.fruit_id = st.fruit_id AND sd.packaging_size = st.packaging_size), 0);
