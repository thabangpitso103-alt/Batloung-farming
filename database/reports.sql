USE batloung_farm;

-- 1. Five most frequently sold fruits (by boxes sold)
SELECT f.fruit_id, f.fruit_name, SUM(sd.quantity) AS total_boxes_sold, COUNT(DISTINCT sd.sale_id) AS number_of_sales
FROM sales_details sd JOIN fruits f ON f.fruit_id = sd.fruit_id
GROUP BY f.fruit_id, f.fruit_name
ORDER BY total_boxes_sold DESC, f.fruit_name
LIMIT 5;

-- 2. Total sales revenue in a date range (change the two dates)
SELECT COUNT(*) AS number_of_sales, COALESCE(SUM(total_amount),0) AS total_revenue, COALESCE(SUM(amount_paid),0) AS total_collected
FROM sales
WHERE sale_date >= '2026-10-01' AND sale_date < DATE_ADD('2026-10-31', INTERVAL 1 DAY);

-- 3. Vendor who purchased the highest number of boxes
SELECT v.vendor_id, v.vendor_name, SUM(sd.quantity) AS total_boxes
FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id JOIN sales_details sd ON sd.sale_id = s.sale_id
GROUP BY v.vendor_id, v.vendor_name
ORDER BY total_boxes DESC, v.vendor_name
LIMIT 1;

-- 4. Current stock level for each fruit and packaging size
SELECT f.fruit_name, st.packaging_size, st.available_quantity
FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id
ORDER BY f.fruit_name, FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE');

-- Bonus: outstanding balance per vendor
SELECT v.vendor_id, v.vendor_name, SUM(s.total_amount) AS total_billed, SUM(s.amount_paid) AS total_paid,
       SUM(s.total_amount - s.amount_paid) AS outstanding_balance
FROM vendors v JOIN sales s ON s.vendor_id = v.vendor_id
GROUP BY v.vendor_id, v.vendor_name
HAVING outstanding_balance > 0
ORDER BY outstanding_balance DESC;
