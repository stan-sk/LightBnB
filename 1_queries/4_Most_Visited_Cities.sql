-- SELECT city, COUNT(reservations.*) AS total_reservations
-- FROM properties
-- JOIN reservations ON property_id = properties.id
-- GROUP BY city
-- ORDER BY total_reservations desc;



SELECT properties.city, count(reservations) as total_reservations
FROM reservations
JOIN properties ON property_id = properties.id
GROUP BY properties.city
ORDER BY total_reservations DESC;