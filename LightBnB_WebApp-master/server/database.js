const { Pool } = require('pg');

const pool = new Pool({
  user: 'T904812',
  password: '',
  host: 'localhost',
  database: 'lightbnb'
});

// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)}) // test the connection


const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithEmail = function(email) {
//   let user;
//   for (const userId in users) {
//     user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       break;
//     } else {
//       user = null;
//     }
//   }
//   return Promise.resolve(user);
// }
// exports.getUserWithEmail = getUserWithEmail;

const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE users.email = $1`, [email])
    .then((result) => {
      // console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return null
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }
// exports.getUserWithId = getUserWithId;

const getUserWithId = (id) => {
  return pool
    .query(`SELECT * FROM users WHERE users.id = $1`, [id])
    .then((result) => {
      // console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return null
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// const addUser =  function(user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// }
// exports.addUser = addUser;

const addUser = (user) => { // user passig in an object
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return null
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }
// exports.getAllReservations = getAllReservations;

const getAllReservations = (guest_id, limit = 10) => {
  return pool
    .query(`SELECT reservations.*, properties.*
            FROM reservations
            JOIN properties ON properties.id = property_id
            JOIN users ON users.id = guest_id
            WHERE guest_id = $1
            GROUP BY properties.id, reservations.id
            ORDER BY end_date desc
            LIMIT 2;`, [guest_id])
    .then((result) => {
      // console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
//  * Get all properties.
//  * @param {{}} options An object containing query options.
//  * @param {*} limit The number of results to return.
//  * @return {Promise<[{}]>}  A promise to the properties.
//  */
// const getAllProperties = function(options, limit = 10) {
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// }
// exports.getAllProperties = getAllProperties;


const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE TRUE
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` AND city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += ` AND properties.cost_per_night > $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += ` AND properties.cost_per_night < $${queryParams.length}`;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += ` AND owner_id = $${queryParams.length}`;
  }

  queryString += ` GROUP BY properties.id`;


  if (options.minimum_rating ) {
    queryParams.push(options.minimum_rating );
    queryString += ` HAVING AVG(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += ` ORDER BY cost_per_night LIMIT $${queryParams.length};`;

  // 4
  // queryParams.push(limit);
  // queryString += `
  // GROUP BY properties.id
  // ORDER BY cost_per_night
  // LIMIT $${queryParams.length};
  // `;

  // 5
  console.log(queryString, queryParams, queryParams.length);

  // 6
  return pool
  .query(queryString, queryParams)
  .then((res) => res.rows)
  .catch((err) => console.log(err.message))
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
// const addProperty = function(property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// }
// exports.addProperty = addProperty;

const addProperty = (property) => { // user passig in an object
  return pool.query(`INSERT INTO properties (owner_id, title, description,thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code, active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *;`, [property.owner_id, property.title, property.description ,property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code, true])
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      return null
    });
};
exports.addProperty = addProperty;
