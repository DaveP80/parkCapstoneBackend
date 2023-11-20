const db = require("../db/dbConfig");

const {
  removeZipCode,
  splitStringIntoSubstrings,
  closeZipCodes,
} = require("../lib/helper/helper");

const {
  SQLSpaceTableError,
  SQLError,
} = require("../lib/errorHandler/customErrors");

const getAll = async () => {
  try {
    const results = await db.any(`
    select
	ps.*,
	p.zip,
	p.picture,
	p.number_spaces,
	p.billing_type,
	p.prop_address
  from
	parking_spaces ps
  join properties p on
	ps.property_lookup_id = p.property_id
  `);

    return results;
  } catch (e) {
    throw new SQLSpaceTableError(e);
  }
};
//get properties and their spaces and information about how many of their spaces are unoccupied
const byZipOrAddr = async (zipCode, addr, sortByPrice) => {
  let requery = false;

  try {
    let orderByClause = "";
    if (sortByPrice) {
      orderByClause = "ORDER BY avg_price DESC";
    }

    if (zipCode?.length) {
      try {
        const results = await db.any(
          `SELECT
            a.*,
            count(*) OVER (PARTITION BY property_id) count_spaces,
            avg(price) OVER (PARTITION BY property_id) avg_price,
            min(price) OVER (PARTITION BY property_id) min_price,
            (
              SELECT count(*)
              FROM bookings
              WHERE is_occupied = true AND booking_space_id IN (
                SELECT space_id
                FROM parking_spaces z
                JOIN properties n ON z.property_lookup_id = n.property_id
                WHERE n.property_id = a.property_id
              )
            ) occupied,
            row_number() OVER (PARTITION BY property_id) row_num
          FROM
            (
              SELECT
                ps.space_id,
                ps.space_no,
                ps.sp_type,
                ps.last_used,
                ps.price,
                pr.prop_address,
                pr.property_id,
                pr.zip,
                pr.billing_type
              FROM
                parking_spaces ps
              JOIN properties pr ON ps.property_lookup_id = pr.property_id
              WHERE pr.location_verified = true
            ) a
          ${orderByClause}`
        );

        if (results.length > 0) {
          let res = results.filter((item) => item.row_num == 1);

          let rzips = closeZipCodes(
            zipCode,
            res.map((item) => item.zip)
          );

          if (rzips.length > 0)
            return results.filter((item) => rzips.includes(item.zip));
          else requery = true;
        } else if (!results.length) {
          requery = true;
        }
      } catch (e) {
        throw new SQLError("no matches or sql syntax error");
      }
    }

    if (requery || !zipCode?.length) {
      try {
        const [addres, zip] = removeZipCode(addr);
        let termsarr = addres;
        let substrings = splitStringIntoSubstrings(termsarr);

        try {
          const results = await db.any(`
            SELECT
              ps.space_id,
              ps.space_no,
              ps.sp_type,
              ps.last_used,
              ps.price,
              pr.prop_address,
              pr.property_id,
              pr.zip,
              pr.billing_type,
              pr.picture,
              count(*) OVER (PARTITION BY property_id) count_spaces,
              avg(price) OVER (PARTITION BY property_id) avg_price,
              min(price) OVER (PARTITION BY property_id) min_price,
              row_number() OVER (PARTITION BY property_id) row_num,
              (
                SELECT count(*)
                FROM bookings
                WHERE is_occupied = true AND booking_space_id IN (
                  SELECT space_id
                  FROM parking_spaces z
                  JOIN properties n ON z.property_lookup_id = n.property_id
                  WHERE n.property_id = pr.property_id
                )
              ) occupied
            FROM
              parking_spaces ps
            JOIN properties pr ON ps.property_lookup_id = pr.property_id
            WHERE pr.location_verified = true
            ${orderByClause}`);

          if (!results?.length) {
            throw new SQLError("no data in spaces table");
          }

          let resultarr = [];
          let stringset = {};

          for (let s of substrings) {
            for (let o of results) {
              if (o.row_num == 1) {
                if (o.prop_address.includes(s)) {
                  stringset[o.property_id] =
                    (stringset[o.property_id] || 0) + 1;
                }
              }
            }
          }

          for (let g of results) {
            if (
              stringset.hasOwnProperty(g.property_id) &&
              stringset[g.property_id] > 2
            ) {
              resultarr.push({ count_match: stringset[g.property_id], ...g });
            }
          }

          resultarr.sort((a, b) => b.count_match - a.count_match);

          return resultarr;
        } catch (e) {
          throw new SQLSpaceTableError(e);
        }
      } catch (e) {
        if (e instanceof SQLError || e instanceof SQLSpaceTableError) throw e;
        else throw new SQLError("no matches or sql syntax error");
      }
    }
  } catch (e) {
    throw e;
  }
};
const byLatLng = async (args) => {
  try {
    const results = await db.any(
      `select
        a.*,
        count(*) over(partition by property_id) count_spaces,
        row_number() over(partition by property_id order by price) row_num,
        (
        select
          count(*)
        from
          bookings
        where
          is_occupied = true
          and booking_space_id in (
          select
            space_id
          from
            parking_spaces z
          join properties n on
            z.property_lookup_id = n.property_id
          where
            n.property_id = a.property_id)) occupied,
        row_number() over(partition by property_id) row_num
        from
      (
            select
            ps.space_id,
            ps.space_no,
            ps.sp_type,
            ps.last_used,
            pr.latitude,
            pr.longitude,
            ps.price,
            pr.prop_address,
            pr.property_id,
            pr.zip,
            pr.billing_type
            from
              parking_spaces ps
            join properties pr on
              ps.property_lookup_id = pr.property_id
            where
              pr.location_verified = true
        ) a
        order by
        point(latitude,
        longitude) <-> point($1,
         $2), count_spaces`,
      args
    );
    return results;
  } catch (e) {
    throw e;
  }
};

const byAddr = async (addr) => {
  [addr, zip] = removeZipCode(addr);
  let termsarr = addr;
  let substrings = splitStringIntoSubstrings(termsarr);
  const ilikeConditions = substrings.map(
    (term) => `pr.prop_address ILIKE '%${term}%'`
  );

  const ilikeClause = ilikeConditions.join(" OR ");

  const query = `
    SELECT
      ps.*,
      pr.prop_address,
      pr.zip,
      pr.billing_type
    FROM
      parking_spaces ps
    JOIN
      properties pr ON ps.property_lookup_id = pr.property_id
    WHERE ${ilikeClause} and pr.location_verified = true`;

  try {
    const results = await db.any(query);

    if (!results?.length && zip?.length > 0) {
      results.push({ zip: zip[0], requery: true });
      return results;
    }

    return results;
  } catch (e) {
    throw new SQLSpaceTableError(e);
  }
};

const byAddrB = async (addr) => {
  [addr, zip] = removeZipCode(addr);
  let termsarr = addr;
  let substrings = splitStringIntoSubstrings(termsarr);
  try {
    const results = await db.any(
      `select ps.*, pr.prop_address, pr.zip, pr.billing_type, pr.property_id from parking_spaces ps join properties pr on ps.property_lookup_id = pr.property_id where pr.location_verified = true`
    );
    if (!results?.length) {
      throw new SQLError("no data in spaces table");
    }

    let resultarr = [];

    let stringset = {};

    for (let s of substrings) {
      for (let o of results) {
        if (o.prop_address.includes(s)) {
          stringset[o.property_id] = (stringset[o.property_id] || 0) + 1;
        }
      }
    }

    for (let g of results) {
      if (stringset.hasOwnProperty(g.property_id)) {
        resultarr.push({ num: stringset[g.property_id], ...g });
      }
    }

    resultarr.sort((a, b) => b.num - a.num);

    return resultarr;
  } catch (e) {
    if (e instanceof SQLError) throw e;
    throw new SQLSpaceTableError(e);
  }
};

const bySpaceId = async (id) => {
  try {
    const results = await db.any(
      `SELECT
  p.*,
  s.*,
  cu.first_name AS owner_first_name,
  cu.last_name AS owner_last_name,
  ru.renter_id,
  ru.renter_address,
  ru.renter_email
FROM
  parking_spaces p
JOIN
  properties s ON p.property_lookup_id = s.property_id
LEFT JOIN
  client_user cu ON s.owner_id = cu.id
LEFT JOIN
  renter_user ru ON p.space_owner_id = ru.renter_id
WHERE
  p.space_id = 50; `,
      id
    );

    console.log("Query Results:", results);

    if (results.length > 0) return results;
    else throw new SQLError("Parking spot not found", 404);
  } catch (e) {
    if (e instanceof SQLError) throw e;
    else throw e;
  }
};

const byOccupied = async (args) => {
  try {
    const results = await db.any(
      `
          select
          ps.*,
          pr.zip
      from
          parking_spaces ps
      join properties pr on
          ps.property_lookup_id = pr.property_id
      where
          ps.occupied = $1 and pr.zip = $2`,
      [bool, zip]
    );

    return results;
  } catch (e) {
    return new SQLSpaceTableError(e);
  }
};

const byZip = async (body) => {
  try {
    const results = await db.any(
      `select
  a.*,
  count(*) over(partition by property_id) count_spaces,
  row_number() over(partition by property_id) row_num
from
  (
  select
  ps.space_id,
  ps.space_no,
  ps.sp_type,
  ps.last_used,
  ps.price,
  pr.prop_address,
  pr.property_id,
  pr.zip,
  pr.billing_type,
  pr.picture
  from
    parking_spaces ps
  join properties pr on
    ps.property_lookup_id = pr.property_id
  where
    pr.zip = $1 and pr.location_verified = true
  ) a
order by
  count_spaces desc`,
      body.zipCode
    );

    return results;
  } catch (e) {
    return new SQLSpaceTableError(e);
  }
};

module.exports = {
  getAll,
  byZip,
  byAddr,
  byAddrB,
  byZipOrAddr,
  byLatLng,
  byOccupied,
  bySpaceId,
};
